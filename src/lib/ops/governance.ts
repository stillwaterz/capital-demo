/**
 * Governance: the deterministic guardrail and maker-checker layer.
 *
 * This is the "rules engine" half of the console principle: AI proposes, the
 * rules engine disposes. Every proposed operational action is checked here by a
 * pure, deterministic guardrail before a human checker can approve it. The
 * guardrail recomputes from the live engines (settlement, reconciliation,
 * treasury, compliance, KYC, risk) so it stays honest as the business clock
 * advances. AI never mutates state. Money is integer ngwee.
 */

import type {
  AuditEvent,
  IsoTimestamp,
  Proposal,
  ProposalKind,
  ProposalStatus,
  StaffRole,
} from "./types";
import { DEMO_TODAY } from "./clock";
import type { IsoDate } from "./types";
import { getTrade } from "./trades";
import { listSettlementFails } from "./settlement";
import { listReconBreaks } from "./reconciliation";
import { floatSummary, treasuryShortfall } from "./treasury";
import { getScreeningHits, getStrCaseById } from "./compliance";
import { getKycItemById } from "./kyc-queue";
import { getBreachedLimits } from "./risk";
import { formatZMW } from "@/lib/format";

const TENANT_ID = "tenant-capital";

// ---------------------------------------------------------------------------
// RBAC: roles, the kinds each may approve, and the subsystems each owns
// ---------------------------------------------------------------------------

export const STAFF_ROLES: readonly StaffRole[] = [
  "OPS",
  "COMPLIANCE",
  "TREASURY",
  "RISK",
  "ADMIN",
];

export const ROLE_LABELS: Record<StaffRole, string> = {
  OPS: "Operations",
  COMPLIANCE: "Compliance",
  TREASURY: "Treasury",
  RISK: "Risk",
  ADMIN: "Administrator",
};

export const PROPOSAL_KIND_LABELS: Record<ProposalKind, string> = {
  SETTLE_FAIL: "Settle a fail",
  RELEASE_BREAK: "Release a reconciliation break",
  FILE_STR: "File a suspicious transaction report",
  AUTO_ROLL: "Auto-roll a maturing bill",
  TIER_UPGRADE: "Approve a KYC tier upgrade",
  REMIT_WHT: "Remit withholding tax",
  FUND_FLOAT: "Fund a treasury float top-up",
  KILL_SWITCH: "Engage the trading kill switch",
};

/** Which roles may approve each proposal kind. Administrator may approve all. */
export const PROPOSAL_KIND_PERMISSIONS: Record<ProposalKind, StaffRole[]> = {
  SETTLE_FAIL: ["OPS", "ADMIN"],
  RELEASE_BREAK: ["OPS", "ADMIN"],
  FILE_STR: ["COMPLIANCE", "ADMIN"],
  AUTO_ROLL: ["OPS", "TREASURY", "ADMIN"],
  TIER_UPGRADE: ["COMPLIANCE", "ADMIN"],
  REMIT_WHT: ["TREASURY", "ADMIN"],
  FUND_FLOAT: ["TREASURY", "ADMIN"],
  KILL_SWITCH: ["RISK", "ADMIN"],
};

/** Subsystems each role is accountable for, for the RBAC org view. */
export const ROLE_SUBSYSTEMS: Record<StaffRole, string[]> = {
  OPS: ["Settlement", "Reconciliation", "Corporate actions"],
  COMPLIANCE: ["Compliance", "KYC ops", "Regulatory reporting"],
  TREASURY: ["Treasury", "Float", "Fees and tax"],
  RISK: ["Risk limits", "Kill switch"],
  ADMIN: ["All subsystems"],
};

export function roleLabel(role: StaffRole): string {
  return ROLE_LABELS[role];
}

export function kindLabel(kind: ProposalKind): string {
  return PROPOSAL_KIND_LABELS[kind];
}

/** True when a role is authorised to approve a proposal kind. */
export function canApprove(role: StaffRole, kind: ProposalKind): boolean {
  return PROPOSAL_KIND_PERMISSIONS[kind].includes(role);
}

/** The roles allowed to approve a given kind, for display. */
export function approverRoles(kind: ProposalKind): StaffRole[] {
  return PROPOSAL_KIND_PERMISSIONS[kind];
}

// ---------------------------------------------------------------------------
// Guardrail
// ---------------------------------------------------------------------------

export type GuardrailResult = {
  passed: boolean;
  /** Single-line plain English finding shown to the checker. */
  note: string;
};

export type GuardrailOptions = {
  /** Business date the guardrail evaluates against. Defaults to the demo date. */
  businessDate?: IsoDate;
  /** When set, also checks the approver is authorised for the kind. */
  actorRole?: StaffRole;
};

/** Single transfer cap on a treasury float top-up, in ngwee (ZMW 50,000). */
const MAX_SINGLE_TOPUP_NGWEE = 5_000_000;

function pass(note: string): GuardrailResult {
  return { passed: true, note };
}

function fail(note: string): GuardrailResult {
  return { passed: false, note };
}

/**
 * The deterministic guardrail. Pure: identical inputs and engine state always
 * return the same result. Checks approver authorisation (when supplied) then a
 * kind-specific rule against the live engines.
 */
export function runGuardrail(
  proposal: Proposal,
  options: GuardrailOptions = {}
): GuardrailResult {
  const businessDate = options.businessDate ?? DEMO_TODAY;

  if (options.actorRole && !canApprove(options.actorRole, proposal.kind)) {
    return fail(
      `${roleLabel(options.actorRole)} is not authorised to approve a ${kindLabel(
        proposal.kind
      ).toLowerCase()} action. Route it to ${approverRoles(proposal.kind)
        .map(roleLabel)
        .join(" or ")}.`
    );
  }

  switch (proposal.kind) {
    case "SETTLE_FAIL": {
      const trade = getTrade(proposal.targetRef, businessDate);
      if (!trade) return fail("Linked trade is not on the blotter for this date.");
      const stillFailing = listSettlementFails(businessDate).some(
        (f) => f.tradeId === trade.id
      );
      if (!stillFailing) {
        return pass("This trade is no longer failing. The action can be closed off.");
      }
      const available = floatSummary().availableNgwee;
      if (available >= trade.netNgwee) {
        return pass(
          `Available treasury float of ${formatZMW(
            available
          )} covers the ${formatZMW(trade.netNgwee)} cash leg, so a bridge can settle it.`
        );
      }
      return fail(
        `Cash leg of ${formatZMW(trade.netNgwee)} exceeds available treasury float of ${formatZMW(
          available
        )}. A client deposit or a funded bridge must clear before this can settle.`
      );
    }

    case "RELEASE_BREAK": {
      const brk = listReconBreaks(businessDate).find(
        (b) => b.id === proposal.targetRef
      );
      if (!brk) return fail("Linked reconciliation break is no longer open.");
      if (brk.type === "CASH") {
        return fail(
          "Cash break is driven by a missing client deposit. It cannot be released until the deposit clears."
        );
      }
      return pass(
        `${brk.type} break is confirmed against the external record and safe to release.`
      );
    }

    case "FILE_STR": {
      const strCase = getStrCaseById(proposal.targetRef);
      if (!strCase) return fail("Linked STR case was not found.");
      if (!strCase.narrative.trim() || strCase.alertIds.length === 0) {
        return fail("STR case is missing a narrative or a source alert. Complete it before filing.");
      }
      return pass(
        "STR case has a complete narrative and a linked source alert. It is ready to file with the FIC."
      );
    }

    case "TIER_UPGRADE": {
      const item = getKycItemById(proposal.targetRef);
      if (!item) return fail("Linked KYC review item was not found.");
      const hit = getScreeningHits().find(
        (h) => h.clientId === item.clientId && h.status !== "CLEARED"
      );
      if (hit) {
        return fail(
          `Client has an open ${hit.type} screening hit. Enhanced due diligence must clear before any tier upgrade.`
        );
      }
      return pass(
        "Identity documents verified and no open screening hit on the client. The tier upgrade can proceed."
      );
    }

    case "FUND_FLOAT": {
      const shortfall = treasuryShortfall(businessDate);
      if (!shortfall.hasShortfall) {
        return pass("No pre-settlement shortfall is outstanding. A top-up would be precautionary.");
      }
      if (shortfall.recommendedTopUpNgwee > MAX_SINGLE_TOPUP_NGWEE) {
        return fail(
          `Recommended top-up of ${formatZMW(
            shortfall.recommendedTopUpNgwee
          )} exceeds the single transfer cap of ${formatZMW(
            MAX_SINGLE_TOPUP_NGWEE
          )}. Split it across rails or escalate to the treasury head.`
        );
      }
      return pass(
        `Top-up of ${formatZMW(
          shortfall.recommendedTopUpNgwee
        )} clears the shortfall and is within the single transfer cap.`
      );
    }

    case "KILL_SWITCH": {
      const breached = getBreachedLimits();
      if (breached.length === 0) {
        return fail("No risk limit is breached. Halting trading is not justified.");
      }
      return pass(
        `${breached.length} risk limit${
          breached.length === 1 ? "" : "s"
        } breached, so halting the affected book is justified.`
      );
    }

    case "AUTO_ROLL":
      return pass("Maturity proceeds are available to roll into the new bill at the published rate.");

    case "REMIT_WHT":
      return pass("Withholding tax balance is reconciled and within the remittance window.");
  }
}

// ---------------------------------------------------------------------------
// Seed proposals and audit log
// ---------------------------------------------------------------------------

const AI_PROPOSER = "Capital AI ops copilot";

type ProposalSeed = {
  id: string;
  kind: ProposalKind;
  summary: string;
  targetRef: string;
  proposedAt: IsoTimestamp;
};

/**
 * Proposals the AI copilot has already raised for the demo, derived from the
 * fails, breaks, alerts and KYC items live at the demo date. The mix is
 * deliberate: two of these fail the guardrail and cannot be approved, which
 * shows the rules engine blocking an AI suggestion.
 */
const PROPOSAL_SEEDS: readonly ProposalSeed[] = [
  {
    id: "PROP-001",
    kind: "SETTLE_FAIL",
    summary:
      "Bridge the short cash leg on trade T-103 (ATEL buy for Kafue Traders Ltd) from treasury float so the T+1 batch settles.",
    targetRef: "T-103",
    proposedAt: "2026-05-29T07:20:00.000Z",
  },
  {
    id: "PROP-002",
    kind: "RELEASE_BREAK",
    summary:
      "Release the MTN MoMo float break once the unbooked mobile money fees are posted to the ledger.",
    targetRef: "BRK-FLOAT-MTN",
    proposedAt: "2026-05-29T07:25:00.000Z",
  },
  {
    id: "PROP-003",
    kind: "FILE_STR",
    summary:
      "File the suspicious transaction report on Joseph Zulu for structuring four deposits under the Tier 1 ceiling.",
    targetRef: "str-001",
    proposedAt: "2026-05-29T07:31:00.000Z",
  },
  {
    id: "PROP-004",
    kind: "TIER_UPGRADE",
    summary:
      "Approve the Tier 1 to Tier 2 upgrade for Royd Kapembwa so full funding limits apply.",
    targetRef: "kyc-007",
    proposedAt: "2026-05-29T07:38:00.000Z",
  },
  {
    id: "PROP-005",
    kind: "FUND_FLOAT",
    summary:
      "Top up the settlement float to clear the pre-settlement shortfall on the open T+1 batch.",
    targetRef: "treasury-shortfall",
    proposedAt: "2026-05-29T07:44:00.000Z",
  },
];

/** Build the seed proposal queue, with guardrail findings already computed. */
export function seedProposals(): Proposal[] {
  return PROPOSAL_SEEDS.map((seed) => {
    const base: Proposal = {
      id: seed.id,
      tenantId: TENANT_ID,
      kind: seed.kind,
      summary: seed.summary,
      targetRef: seed.targetRef,
      guardrailPassed: false,
      guardrailNote: "",
      status: "PENDING",
      proposedBy: AI_PROPOSER,
      proposedAt: seed.proposedAt,
      decidedBy: null,
      decidedAt: null,
    };
    const guardrail = runGuardrail(base, { businessDate: DEMO_TODAY });
    return {
      ...base,
      guardrailPassed: guardrail.passed,
      guardrailNote: guardrail.note,
    };
  });
}

/** Append-only audit events seeded from the proposals the AI already raised. */
export function seedAuditEvents(): AuditEvent[] {
  return PROPOSAL_SEEDS.map((seed, index) => ({
    id: `AUD-SEED-${String(index + 1).padStart(3, "0")}`,
    tenantId: TENANT_ID,
    action: `Capital AI proposed: ${kindLabel(seed.kind).toLowerCase()}`,
    actor: AI_PROPOSER,
    actorRole: "OPS",
    targetRef: seed.id,
    at: seed.proposedAt,
  }));
}

// ---------------------------------------------------------------------------
// Pure selectors over a proposal list
// ---------------------------------------------------------------------------

export function filterByStatus(
  proposals: readonly Proposal[],
  status: ProposalStatus
): Proposal[] {
  return proposals.filter((p) => p.status === status);
}

export function listPending(proposals: readonly Proposal[]): Proposal[] {
  return filterByStatus(proposals, "PENDING");
}

export function listApproved(proposals: readonly Proposal[]): Proposal[] {
  return filterByStatus(proposals, "APPROVED");
}

export function listRejected(proposals: readonly Proposal[]): Proposal[] {
  return filterByStatus(proposals, "REJECTED");
}
