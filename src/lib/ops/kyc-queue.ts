/**
 * KYC operations engine: onboarding review queue, tier-upgrade requests and the
 * periodic refresh-due list for the operations console.
 *
 * The tier model follows BUILD_SPEC.md and the FIC/DPA Zambia 2021 framework:
 * - Tier 0 (Explorer): phone OTP only, read-only, no wallet, no funding.
 * - Tier 1 (Light Trader): NRC plus selfie liveness, up to ZMW 10,000 per month.
 * - Tier 2 (Full Investor): Tier 1 plus ZRA TPIN and proof of address, up to
 *   ZMW 500,000 per month.
 *
 * Deterministic seed data only. Monthly limits are integer ngwee.
 */

import type {
  IsoTimestamp,
  KycReviewItem,
  KycStatus,
  KycTier,
  Ngwee,
} from "./types";

const TENANT_ID = "tenant-capital";

// ---------------------------------------------------------------------------
// Tier model
// ---------------------------------------------------------------------------

export type KycTierSpec = {
  tier: KycTier;
  /** Customer-facing name of the tier. */
  name: string;
  /** Monthly transaction ceiling in ngwee. Tier 0 has no wallet so it is zero. */
  monthlyLimitNgwee: Ngwee;
  /** Identity and verification requirements to reach the tier. */
  requirements: string[];
  /** What the tier can do. */
  capability: string;
};

export const KYC_TIER_SPECS: readonly KycTierSpec[] = [
  {
    tier: "TIER_0",
    name: "Explorer",
    monthlyLimitNgwee: 0,
    requirements: ["Phone OTP"],
    capability: "Read-only prices, research and watchlists. No wallet.",
  },
  {
    tier: "TIER_1",
    name: "Light Trader",
    monthlyLimitNgwee: 1_000_000, // ZMW 10,000
    requirements: ["NRC", "Selfie liveness", "Mobile money KYC reuse with consent"],
    capability: "Trade LuSE equities. Mobile money funding.",
  },
  {
    tier: "TIER_2",
    name: "Full Investor",
    monthlyLimitNgwee: 50_000_000, // ZMW 500,000
    requirements: [
      "ZRA TPIN",
      "Proof of address",
      "Source of funds",
      "Risk profile",
    ],
    capability: "Full instrument set. Bank and mobile money funding.",
  },
];

export function getTierSpec(tier: KycTier): KycTierSpec {
  const spec = KYC_TIER_SPECS.find((s) => s.tier === tier);
  // The union is exhaustive so this is always defined; assert for the type.
  return spec ?? KYC_TIER_SPECS[0];
}

export function tierLabel(tier: KycTier): string {
  const spec = getTierSpec(tier);
  return `${spec.tier.replace("_", " ")} ${spec.name}`;
}

// ---------------------------------------------------------------------------
// Review queue seed data
// ---------------------------------------------------------------------------

/**
 * Onboarding and lifecycle review items spanning Tier 0 to Tier 2, including
 * tier-upgrade requests and periodic refresh-due reviews. NRC and TPIN style
 * references are illustrative.
 */
export const KYC_QUEUE: readonly KycReviewItem[] = [
  {
    id: "kyc-001",
    tenantId: TENANT_ID,
    clientId: "cust-mwale",
    clientName: "Chanda Mwale",
    currentTier: "TIER_1",
    requestedTier: "TIER_2",
    status: "IN_REVIEW",
    note: "TPIN 1002384756 verified. Proof of address (Zesco bill) under review. Source of funds questionnaire complete.",
    submittedAt: "2026-05-28T09:05:00.000Z",
    reviewedAt: null,
  },
  {
    id: "kyc-002",
    tenantId: TENANT_ID,
    clientId: "cust-banda",
    clientName: "Mutale Banda",
    currentTier: "TIER_0",
    requestedTier: "TIER_1",
    status: "PENDING",
    note: "NRC 234567/61/1 captured. Awaiting selfie liveness result before auto-approval.",
    submittedAt: "2026-05-29T05:40:00.000Z",
    reviewedAt: null,
  },
  {
    id: "kyc-003",
    tenantId: TENANT_ID,
    clientId: "cust-phiri",
    clientName: "Bwalya Phiri",
    currentTier: "TIER_0",
    requestedTier: "TIER_1",
    status: "IN_REVIEW",
    note: "Airtel mobile money KYC reuse consented. NRC 556102/74/2 name mismatch with wallet record flagged for manual check.",
    submittedAt: "2026-05-28T14:22:00.000Z",
    reviewedAt: null,
  },
  {
    id: "kyc-004",
    tenantId: TENANT_ID,
    clientId: "cust-nkhoma",
    clientName: "Thandiwe Nkhoma",
    currentTier: "TIER_1",
    requestedTier: "TIER_1",
    status: "APPROVED",
    note: "NRC and selfie liveness passed. Auto-approved in 2 minutes 14 seconds.",
    submittedAt: "2026-05-27T10:11:00.000Z",
    reviewedAt: "2026-05-27T10:13:00.000Z",
  },
  {
    id: "kyc-005",
    tenantId: TENANT_ID,
    clientId: "cust-chisanga",
    clientName: "Lombe Chisanga",
    currentTier: "TIER_0",
    requestedTier: "TIER_1",
    status: "REJECTED",
    note: "Selfie liveness failed three attempts and NRC image was unreadable. Client asked to resubmit.",
    submittedAt: "2026-05-26T16:48:00.000Z",
    reviewedAt: "2026-05-26T17:02:00.000Z",
  },
  {
    id: "kyc-006",
    tenantId: TENANT_ID,
    clientId: "cust-sakala",
    clientName: "Emmanuel Sakala",
    currentTier: "TIER_2",
    requestedTier: "TIER_2",
    status: "REFRESH_DUE",
    note: "Annual Tier 2 review due. Proof of address older than 12 months. Refresh of source of funds requested.",
    submittedAt: "2026-05-20T08:00:00.000Z",
    reviewedAt: null,
  },
  {
    id: "kyc-007",
    tenantId: TENANT_ID,
    clientId: "cust-kapembwa",
    clientName: "Royd Kapembwa",
    currentTier: "TIER_1",
    requestedTier: "TIER_2",
    status: "IN_REVIEW",
    note: "PEP match on file. Enhanced due diligence and source of wealth review required before Tier 2 funding is enabled.",
    submittedAt: "2026-05-26T09:35:00.000Z",
    reviewedAt: null,
  },
  {
    id: "kyc-008",
    tenantId: TENANT_ID,
    clientId: "cust-mwansa",
    clientName: "Kelvin Mwansa",
    currentTier: "TIER_2",
    requestedTier: "TIER_2",
    status: "REFRESH_DUE",
    note: "Diaspora client (United Kingdom). Periodic refresh of proof of address and risk profile due this month.",
    submittedAt: "2026-05-22T19:10:00.000Z",
    reviewedAt: null,
  },
];

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** New onboarding submissions awaiting a decision. */
export function getOnboardingQueue(): KycReviewItem[] {
  return KYC_QUEUE.filter(
    (item) => item.status === "PENDING" || item.status === "IN_REVIEW"
  );
}

/** Items asking to move up a tier (requested tier above current tier). */
export function getTierUpgradeRequests(): KycReviewItem[] {
  return KYC_QUEUE.filter((item) => item.requestedTier !== item.currentTier);
}

/** Existing clients whose periodic review has come due. */
export function getRefreshDue(): KycReviewItem[] {
  return KYC_QUEUE.filter((item) => item.status === "REFRESH_DUE");
}

export function getKycItemById(id: string): KycReviewItem | undefined {
  return KYC_QUEUE.find((item) => item.id === id);
}

export type KycSummary = {
  total: number;
  pending: number;
  inReview: number;
  approved: number;
  rejected: number;
  refreshDue: number;
  upgradeRequests: number;
  byStatus: Record<KycStatus, number>;
};

const KYC_STATUSES: readonly KycStatus[] = [
  "PENDING",
  "IN_REVIEW",
  "APPROVED",
  "REJECTED",
  "REFRESH_DUE",
];

export function kycSummary(): KycSummary {
  const byStatus = KYC_STATUSES.reduce<Record<KycStatus, number>>(
    (acc, status) => {
      acc[status] = KYC_QUEUE.filter((item) => item.status === status).length;
      return acc;
    },
    {
      PENDING: 0,
      IN_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      REFRESH_DUE: 0,
    }
  );

  return {
    total: KYC_QUEUE.length,
    pending: byStatus.PENDING,
    inReview: byStatus.IN_REVIEW,
    approved: byStatus.APPROVED,
    rejected: byStatus.REJECTED,
    refreshDue: byStatus.REFRESH_DUE,
    upgradeRequests: getTierUpgradeRequests().length,
    byStatus,
  };
}

export function submittedAtIso(item: KycReviewItem): IsoTimestamp {
  return item.submittedAt;
}
