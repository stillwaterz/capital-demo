"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuditEvent, Proposal, StaffRole } from "@/lib/ops/types";
import {
  kindLabel,
  runGuardrail,
  seedAuditEvents,
  seedProposals,
} from "@/lib/ops/governance";
import { useOpsClockStore } from "@/lib/store/ops-clock";

/** Who is taking a maker-checker decision. */
export type Actor = {
  name: string;
  role: StaffRole;
};

type GovernanceState = {
  /** The live proposal queue. */
  proposals: Proposal[];
  /** Append-only audit log, newest first. */
  audit: AuditEvent[];
};

type GovernanceActions = {
  /** Add a new AI proposal. Runs the guardrail to stamp its finding. */
  addProposal: (
    input: Pick<Proposal, "kind" | "summary" | "targetRef"> & {
      proposedBy?: string;
    }
  ) => void;
  /** Approve a pending proposal. Blocked when the guardrail fails. */
  approve: (id: string, actor: Actor) => void;
  /** Reject a pending proposal. */
  reject: (id: string, actor: Actor) => void;
  /** Restore the seeded queue and audit log. */
  reset: () => void;
};

const TENANT_ID = "tenant-capital";

function now(): string {
  return new Date().toISOString();
}

function makeAuditEvent(input: {
  action: string;
  actor: string;
  actorRole: StaffRole;
  targetRef: string | null;
}): AuditEvent {
  return {
    id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tenantId: TENANT_ID,
    action: input.action,
    actor: input.actor,
    actorRole: input.actorRole,
    targetRef: input.targetRef,
    at: now(),
  };
}

function defaultState(): GovernanceState {
  return {
    proposals: seedProposals(),
    audit: seedAuditEvents().sort((a, b) => (a.at < b.at ? 1 : -1)),
  };
}

export const useOpsGovernanceStore = create<
  GovernanceState & GovernanceActions
>()(
  persist(
    (set) => ({
      ...defaultState(),

      addProposal: (input) =>
        set((state) => {
          const businessDate = useOpsClockStore.getState().businessDate;
          const proposedBy = input.proposedBy ?? "Capital AI ops copilot";
          const proposal: Proposal = {
            id: `PROP-${Date.now()}`,
            tenantId: TENANT_ID,
            kind: input.kind,
            summary: input.summary,
            targetRef: input.targetRef,
            guardrailPassed: false,
            guardrailNote: "",
            status: "PENDING",
            proposedBy,
            proposedAt: now(),
            decidedBy: null,
            decidedAt: null,
          };
          const guardrail = runGuardrail(proposal, { businessDate });
          proposal.guardrailPassed = guardrail.passed;
          proposal.guardrailNote = guardrail.note;

          const event = makeAuditEvent({
            action: `Capital AI proposed: ${kindLabel(input.kind).toLowerCase()}`,
            actor: proposedBy,
            actorRole: "OPS",
            targetRef: proposal.id,
          });

          return {
            proposals: [proposal, ...state.proposals],
            audit: [event, ...state.audit],
          };
        }),

      approve: (id, actor) =>
        set((state) => {
          const proposal = state.proposals.find((p) => p.id === id);
          if (!proposal || proposal.status !== "PENDING") return state;

          const businessDate = useOpsClockStore.getState().businessDate;
          const guardrail = runGuardrail(proposal, {
            businessDate,
            actorRole: actor.role,
          });

          if (!guardrail.passed) {
            const blocked = makeAuditEvent({
              action: `Approval blocked by guardrail: ${guardrail.note}`,
              actor: actor.name,
              actorRole: actor.role,
              targetRef: proposal.id,
            });
            return { ...state, audit: [blocked, ...state.audit] };
          }

          const decidedAt = now();
          const proposals = state.proposals.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "APPROVED" as const,
                  guardrailPassed: true,
                  guardrailNote: guardrail.note,
                  decidedBy: actor.name,
                  decidedAt,
                }
              : p
          );
          const event = makeAuditEvent({
            action: `Approved: ${kindLabel(proposal.kind).toLowerCase()}`,
            actor: actor.name,
            actorRole: actor.role,
            targetRef: proposal.id,
          });
          return { proposals, audit: [event, ...state.audit] };
        }),

      reject: (id, actor) =>
        set((state) => {
          const proposal = state.proposals.find((p) => p.id === id);
          if (!proposal || proposal.status !== "PENDING") return state;

          const decidedAt = now();
          const proposals = state.proposals.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "REJECTED" as const,
                  decidedBy: actor.name,
                  decidedAt,
                }
              : p
          );
          const event = makeAuditEvent({
            action: `Rejected: ${kindLabel(proposal.kind).toLowerCase()}`,
            actor: actor.name,
            actorRole: actor.role,
            targetRef: proposal.id,
          });
          return { proposals, audit: [event, ...state.audit] };
        }),

      reset: () => set(defaultState()),
    }),
    { name: "ml-ops-governance" }
  )
);
