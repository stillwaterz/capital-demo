/**
 * Onboarding agent (mock Kyc).
 *
 * Runs the applicant through the Kyc adapter (identity, liveness, AML and PEP),
 * then the deterministic risk engine decides tier and whether a compliance human
 * must review. AI and providers propose, the rules engine disposes: the agent
 * never opens an account on its own, it produces a decision the account service
 * acts on and routes flagged cases to the approval queue.
 */

import { getAdapters } from "@/lib/adapters";
import type { KycApplicant } from "@/lib/adapters/types";
import { decideOnboarding, type OnboardingDecision } from "./risk";

export type OnboardingRequest = {
  applicant: KycApplicant;
  isPep: boolean;
  sourceOfFundsProvided: boolean;
  declaredMonthlyDepositNgwee: number;
  adverseFlags?: string[];
};

export type OnboardingOutcome = {
  decision: OnboardingDecision;
  /** Provider or stub reference for the screen, for the audit trail. */
  providerRef: string;
  /** True when the case must sit in the compliance approval queue first. */
  queuedForReview: boolean;
};

/** Screen an applicant and return the onboarding decision. */
export async function runOnboarding(
  request: OnboardingRequest
): Promise<OnboardingOutcome> {
  const screening = await getAdapters().kyc.screen(request.applicant);
  const decision = decideOnboarding({
    screening,
    isPep: request.isPep,
    sourceOfFundsProvided: request.sourceOfFundsProvided,
    declaredMonthlyDepositNgwee: request.declaredMonthlyDepositNgwee,
    adverseFlags: request.adverseFlags ?? [],
  });
  return {
    decision,
    providerRef: screening.providerRef,
    queuedForReview: decision.requiresReview,
  };
}
