/**
 * Deterministic onboarding risk scoring and tier assignment.
 *
 * The Onboarding agent (BUILD_SPEC sections 1 and the AI guardrail model)
 * proposes an outcome, but the tier a client actually receives and whether a
 * human compliance officer must sign off is decided here, deterministically.
 * AI proposes, this rules layer disposes.
 *
 * Tier ladder (BUILD_SPEC section 1):
 * - TIER_0 Explorer: no wallet. Assigned when the KYC screen fails outright.
 * - TIER_1 Light Trader (up to ZMW 10,000 per month): a clean MNO-verified pass.
 * - TIER_2 Full Investor (up to ZMW 500,000 per month): needs source of funds.
 *
 * All money is integer ngwee. No floats. Every weighting is a named constant so
 * the score is auditable and reproducible.
 */

import type { KycScreeningResult } from "@/lib/adapters/types";
import type { KycTier, Ngwee } from "@/lib/ops/types";

// ---------------------------------------------------------------------------
// Score bounds
// ---------------------------------------------------------------------------

const RISK_SCORE_MIN = 0;
const RISK_SCORE_MAX = 100;

// ---------------------------------------------------------------------------
// Risk weightings. Higher means riskier. Documented and fixed.
// ---------------------------------------------------------------------------

/** A politically exposed person carries elevated bribery and graft risk. */
const PEP_RISK_WEIGHT = 40;
/** A "refer" screen means a match the provider could not clear automatically. */
const REFER_OUTCOME_RISK_WEIGHT = 25;
/** A "fail" screen is a hard adverse result (for example a sanctions hit). */
const FAIL_OUTCOME_RISK_WEIGHT = 60;
/** No stated source of funds blocks the full tier and raises AML risk. */
const MISSING_SOURCE_OF_FUNDS_RISK_WEIGHT = 15;
/** Each machine-readable adverse flag adds incremental risk. */
const ADVERSE_FLAG_RISK_WEIGHT = 10;
/** A declared deposit above the light-tier cap needs closer scrutiny. */
const LARGE_DEPOSIT_RISK_WEIGHT = 20;

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/** Light-tier monthly cap: ZMW 10,000 expressed in ngwee (1 ZMW = 100 ngwee). */
const TIER_1_MONTHLY_CAP_NGWEE: Ngwee = 1_000_000;
/** A declared monthly deposit above the light-tier cap counts as large. */
const LARGE_DEPOSIT_THRESHOLD_NGWEE: Ngwee = TIER_1_MONTHLY_CAP_NGWEE;
/** A score at or above this forces a human compliance review. */
const COMPLIANCE_REVIEW_SCORE_THRESHOLD = 50;

/** Reason-code fragments that always route a case to compliance. */
const HIGH_RISK_REASON_FRAGMENTS = ["SANCTION", "ADVERSE", "PEP"] as const;

// ---------------------------------------------------------------------------
// Derived reason codes emitted by the decision (for the audit trail).
// ---------------------------------------------------------------------------

const REASON_PEP_DECLARED = "PEP_DECLARED";
const REASON_SOURCE_OF_FUNDS_MISSING = "SOURCE_OF_FUNDS_MISSING";
const REASON_LARGE_DEPOSIT = "LARGE_DEPOSIT";
const REASON_HIGH_RISK_SCORE = "HIGH_RISK_SCORE";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Everything the rules layer needs to score and tier an applicant: the KYC
 * provider result plus the attributes the applicant declared during the
 * conversational onboarding flow.
 */
export type OnboardingDecisionInput = {
  /** Result from the KYC adapter screen (identity, liveness, AML, PEP). */
  screening: KycScreeningResult;
  /** Declared politically exposed person status. */
  isPep: boolean;
  /** Whether the applicant supplied an acceptable source of funds. */
  sourceOfFundsProvided: boolean;
  /** Declared monthly deposit intent, integer ngwee. */
  declaredMonthlyDepositNgwee: Ngwee;
  /** Extra adverse flags raised outside the provider result. */
  adverseFlags: string[];
};

/** Aggregated onboarding outcome used to open an account and gate review. */
export type OnboardingDecision = {
  /** 0-100 integer, higher means riskier. */
  riskScore: number;
  /** Tier the applicant qualifies for on this decision. */
  tier: KycTier;
  /** True when a human compliance officer must approve before activation. */
  requiresReview: boolean;
  /** De-duplicated audit reason codes explaining the decision. */
  reasonCodes: string[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isLargeDeposit(declaredMonthlyDepositNgwee: Ngwee): boolean {
  return declaredMonthlyDepositNgwee > LARGE_DEPOSIT_THRESHOLD_NGWEE;
}

function clampScore(raw: number): number {
  return Math.min(RISK_SCORE_MAX, Math.max(RISK_SCORE_MIN, raw));
}

/** True when any reason code matches a high-risk fragment (sanctions, adverse). */
function hasHighRiskReasonCode(codes: string[]): boolean {
  return codes.some((code) =>
    HIGH_RISK_REASON_FRAGMENTS.some((fragment) =>
      code.toUpperCase().includes(fragment),
    ),
  );
}

// ---------------------------------------------------------------------------
// Public rules
// ---------------------------------------------------------------------------

/**
 * Compute a 0-100 integer risk score. PEP status, refer or fail outcomes, a
 * large declared deposit, missing source of funds and each adverse flag all
 * raise the score. Monotonic in every risky input, then clamped to the bounds.
 */
export function computeRiskScore(input: OnboardingDecisionInput): number {
  let score = RISK_SCORE_MIN;

  if (input.isPep) score += PEP_RISK_WEIGHT;
  if (input.screening.outcome === "refer") score += REFER_OUTCOME_RISK_WEIGHT;
  if (input.screening.outcome === "fail") score += FAIL_OUTCOME_RISK_WEIGHT;
  if (!input.sourceOfFundsProvided) score += MISSING_SOURCE_OF_FUNDS_RISK_WEIGHT;
  if (isLargeDeposit(input.declaredMonthlyDepositNgwee)) {
    score += LARGE_DEPOSIT_RISK_WEIGHT;
  }
  score += input.adverseFlags.length * ADVERSE_FLAG_RISK_WEIGHT;

  return clampScore(score);
}

/**
 * Assign the tier the applicant qualifies for. A failed screen grants nothing
 * (TIER_0). Any non-failed screen starts at the light tier (TIER_1); the full
 * tier (TIER_2) additionally requires a stated source of funds.
 */
export function assignTier(input: OnboardingDecisionInput): KycTier {
  if (input.screening.outcome === "fail") return "TIER_0";
  if (input.sourceOfFundsProvided) return "TIER_2";
  return "TIER_1";
}

/**
 * Decide whether the case must go to the compliance approval queue. Flags are
 * PEP status, a refer or fail outcome, a high risk score, or a sanctions or
 * adverse reason code from either the provider result or the extra flags.
 */
export function requiresComplianceReview(
  input: OnboardingDecisionInput,
): boolean {
  if (input.isPep) return true;
  if (input.screening.outcome !== "pass") return true;
  if (computeRiskScore(input) >= COMPLIANCE_REVIEW_SCORE_THRESHOLD) return true;
  const codes = [...input.screening.reasonCodes, ...input.adverseFlags];
  return hasHighRiskReasonCode(codes);
}

/**
 * Aggregate the onboarding decision: the risk score, the qualifying tier,
 * whether compliance review is required and the de-duplicated reason codes.
 * A clean case opens a MarketLink account directly; a flagged case is pushed
 * to the compliance approval queue and activates only on approval.
 */
export function decideOnboarding(
  input: OnboardingDecisionInput,
): OnboardingDecision {
  const reasonCodes = new Set<string>([
    ...input.screening.reasonCodes,
    ...input.adverseFlags,
  ]);

  const riskScore = computeRiskScore(input);

  if (input.isPep) reasonCodes.add(REASON_PEP_DECLARED);
  if (!input.sourceOfFundsProvided) reasonCodes.add(REASON_SOURCE_OF_FUNDS_MISSING);
  if (isLargeDeposit(input.declaredMonthlyDepositNgwee)) {
    reasonCodes.add(REASON_LARGE_DEPOSIT);
  }
  if (riskScore >= COMPLIANCE_REVIEW_SCORE_THRESHOLD) {
    reasonCodes.add(REASON_HIGH_RISK_SCORE);
  }

  return {
    riskScore,
    tier: assignTier(input),
    requiresReview: requiresComplianceReview(input),
    reasonCodes: [...reasonCodes],
  };
}
