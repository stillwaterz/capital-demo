/**
 * Mock Kyc binding.
 *
 * Passes every applicant at the light tier, the "mock pass" from BUILD_SPEC.
 * In production this port is filled by MNO identity, liveness, AML and PEP
 * providers. The Onboarding agent (a later task) calls through this port.
 */

import type { KycAdapter, KycScreeningResult } from "../types";

/** Light tier granted on a clean mock pass. Full tier needs source-of-funds. */
const LIGHT_TIER = "TIER_1" as const;

export const mockKycAdapter: KycAdapter = {
  async screen(applicant) {
    const result: KycScreeningResult = {
      outcome: "pass",
      reasonCodes: [],
      grantedTier: LIGHT_TIER,
      providerRef: `mock-kyc-${applicant.idType}-${applicant.idNumber}`,
      checkedAt: new Date().toISOString(),
    };
    return result;
  },
};
