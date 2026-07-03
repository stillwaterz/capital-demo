import { describe, expect, it } from "vitest";

import type { KycScreeningResult } from "@/lib/adapters/types";
import type { Ngwee } from "@/lib/ops/types";

import {
  assignTier,
  computeRiskScore,
  decideOnboarding,
  requiresComplianceReview,
  type OnboardingDecisionInput,
} from "@/lib/onboarding/risk";

// ZMW 5,000 sits under the light-tier cap; ZMW 50,000 sits well above it.
const SMALL_DEPOSIT_NGWEE: Ngwee = 500_000;
const LARGE_DEPOSIT_NGWEE: Ngwee = 5_000_000;

const CHECKED_AT = "2026-07-03T09:00:00.000Z";

function screening(
  overrides: Partial<KycScreeningResult> = {},
): KycScreeningResult {
  return {
    outcome: "pass",
    reasonCodes: [],
    grantedTier: "TIER_1",
    providerRef: "stub-ref",
    checkedAt: CHECKED_AT,
    ...overrides,
  };
}

function input(
  overrides: Partial<OnboardingDecisionInput> = {},
): OnboardingDecisionInput {
  return {
    screening: screening(overrides.screening),
    isPep: false,
    sourceOfFundsProvided: false,
    declaredMonthlyDepositNgwee: SMALL_DEPOSIT_NGWEE,
    adverseFlags: [],
    ...overrides,
  };
}

describe("assignTier", () => {
  it("grants the light tier on a clean MNO-verified pass", () => {
    expect(assignTier(input())).toBe("TIER_1");
  });

  it("caps at the light tier when source of funds is missing", () => {
    const cleanNoSof = input({ sourceOfFundsProvided: false });
    expect(assignTier(cleanNoSof)).toBe("TIER_1");
  });

  it("unlocks the full tier when source of funds is provided", () => {
    const withSof = input({ sourceOfFundsProvided: true });
    expect(assignTier(withSof)).toBe("TIER_2");
  });

  it("grants nothing (TIER_0) when the screen fails", () => {
    const failed = input({
      screening: screening({ outcome: "fail", reasonCodes: ["SANCTIONS_HIT"] }),
      sourceOfFundsProvided: true,
    });
    expect(assignTier(failed)).toBe("TIER_0");
  });
});

describe("computeRiskScore", () => {
  it("returns a low integer score for a clean applicant", () => {
    const score = computeRiskScore(
      input({ sourceOfFundsProvided: true }),
    );
    expect(Number.isInteger(score)).toBe(true);
    expect(score).toBe(0);
  });

  it("stays within the 0-100 bounds even when everything is risky", () => {
    const worst = input({
      screening: screening({
        outcome: "fail",
        reasonCodes: ["SANCTIONS_HIT", "ADVERSE_MEDIA"],
      }),
      isPep: true,
      sourceOfFundsProvided: false,
      declaredMonthlyDepositNgwee: LARGE_DEPOSIT_NGWEE,
      adverseFlags: ["FLAG_A", "FLAG_B", "FLAG_C"],
    });
    const score = computeRiskScore(worst);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBe(100);
  });

  it("raises the score for a PEP", () => {
    const base = input({ sourceOfFundsProvided: true });
    expect(computeRiskScore({ ...base, isPep: true })).toBeGreaterThan(
      computeRiskScore(base),
    );
  });

  it("raises the score for a refer outcome and more for a fail outcome", () => {
    const base = input({ sourceOfFundsProvided: true });
    const refer = computeRiskScore({
      ...base,
      screening: screening({ outcome: "refer" }),
    });
    const fail = computeRiskScore({
      ...base,
      screening: screening({ outcome: "fail" }),
    });
    expect(refer).toBeGreaterThan(computeRiskScore(base));
    expect(fail).toBeGreaterThan(refer);
  });

  it("raises the score for a large declared deposit", () => {
    const base = input({ sourceOfFundsProvided: true });
    const large = computeRiskScore({
      ...base,
      declaredMonthlyDepositNgwee: LARGE_DEPOSIT_NGWEE,
    });
    expect(large).toBeGreaterThan(computeRiskScore(base));
  });

  it("raises the score when source of funds is missing", () => {
    const withSof = input({ sourceOfFundsProvided: true });
    const withoutSof = input({ sourceOfFundsProvided: false });
    expect(computeRiskScore(withoutSof)).toBeGreaterThan(
      computeRiskScore(withSof),
    );
  });

  it("raises the score for each adverse flag (monotonic)", () => {
    const base = input({ sourceOfFundsProvided: true });
    const one = computeRiskScore({ ...base, adverseFlags: ["FLAG_A"] });
    const two = computeRiskScore({
      ...base,
      adverseFlags: ["FLAG_A", "FLAG_B"],
    });
    expect(one).toBeGreaterThan(computeRiskScore(base));
    expect(two).toBeGreaterThan(one);
  });

  it("is monotonic: adding any risky input never lowers the score", () => {
    const clean = input({ sourceOfFundsProvided: true });
    const base = computeRiskScore(clean);
    const riskier: OnboardingDecisionInput[] = [
      { ...clean, isPep: true },
      { ...clean, screening: screening({ outcome: "refer" }) },
      { ...clean, sourceOfFundsProvided: false },
      { ...clean, declaredMonthlyDepositNgwee: LARGE_DEPOSIT_NGWEE },
      { ...clean, adverseFlags: ["FLAG_A"] },
    ];
    for (const candidate of riskier) {
      expect(computeRiskScore(candidate)).toBeGreaterThanOrEqual(base);
    }
  });
});

describe("requiresComplianceReview", () => {
  it("does not flag a clean low-risk pass", () => {
    expect(requiresComplianceReview(input({ sourceOfFundsProvided: true }))).toBe(
      false,
    );
  });

  it("flags any PEP", () => {
    expect(
      requiresComplianceReview(input({ isPep: true, sourceOfFundsProvided: true })),
    ).toBe(true);
  });

  it("flags a refer outcome", () => {
    expect(
      requiresComplianceReview(
        input({
          screening: screening({ outcome: "refer" }),
          sourceOfFundsProvided: true,
        }),
      ),
    ).toBe(true);
  });

  it("flags a fail outcome", () => {
    expect(
      requiresComplianceReview(
        input({
          screening: screening({ outcome: "fail" }),
          sourceOfFundsProvided: true,
        }),
      ),
    ).toBe(true);
  });

  it("flags a high risk score even on a pass", () => {
    const highScore = input({
      sourceOfFundsProvided: false,
      declaredMonthlyDepositNgwee: LARGE_DEPOSIT_NGWEE,
      adverseFlags: ["FLAG_A", "FLAG_B"],
    });
    expect(computeRiskScore(highScore)).toBeGreaterThanOrEqual(50);
    expect(requiresComplianceReview(highScore)).toBe(true);
  });

  it("flags a sanctions or adverse reason code on a pass", () => {
    const adverse = input({
      screening: screening({ reasonCodes: ["SANCTIONS_WATCHLIST"] }),
      sourceOfFundsProvided: true,
    });
    expect(requiresComplianceReview(adverse)).toBe(true);
  });
});

describe("decideOnboarding", () => {
  it("opens a clean pass at TIER_1 with no review", () => {
    const decision = decideOnboarding(input());
    expect(decision.tier).toBe("TIER_1");
    expect(decision.requiresReview).toBe(false);
    expect(decision.reasonCodes).toContain("SOURCE_OF_FUNDS_MISSING");
  });

  it("opens a full clean pass at TIER_2 with no review and no reason codes", () => {
    const decision = decideOnboarding(input({ sourceOfFundsProvided: true }));
    expect(decision.tier).toBe("TIER_2");
    expect(decision.requiresReview).toBe(false);
    expect(decision.reasonCodes).toEqual([]);
  });

  it("forces review and records the PEP reason for a PEP applicant", () => {
    const decision = decideOnboarding(
      input({ isPep: true, sourceOfFundsProvided: true }),
    );
    expect(decision.requiresReview).toBe(true);
    expect(decision.reasonCodes).toContain("PEP_DECLARED");
  });

  it("gives TIER_0 and review on a failed screen", () => {
    const decision = decideOnboarding(
      input({
        screening: screening({ outcome: "fail", reasonCodes: ["SANCTIONS_HIT"] }),
        sourceOfFundsProvided: true,
      }),
    );
    expect(decision.tier).toBe("TIER_0");
    expect(decision.requiresReview).toBe(true);
    expect(decision.reasonCodes).toContain("SANCTIONS_HIT");
  });

  it("records the high risk score reason when over the threshold", () => {
    const decision = decideOnboarding(
      input({
        sourceOfFundsProvided: false,
        declaredMonthlyDepositNgwee: LARGE_DEPOSIT_NGWEE,
        adverseFlags: ["FLAG_A", "FLAG_B"],
      }),
    );
    expect(decision.reasonCodes).toContain("HIGH_RISK_SCORE");
    expect(decision.reasonCodes).toContain("LARGE_DEPOSIT");
  });

  it("de-duplicates reason codes carried from the screen and flags", () => {
    const decision = decideOnboarding(
      input({
        screening: screening({ reasonCodes: ["ADVERSE_MEDIA"] }),
        adverseFlags: ["ADVERSE_MEDIA"],
        sourceOfFundsProvided: true,
      }),
    );
    const occurrences = decision.reasonCodes.filter(
      (code) => code === "ADVERSE_MEDIA",
    );
    expect(occurrences).toHaveLength(1);
  });
});
