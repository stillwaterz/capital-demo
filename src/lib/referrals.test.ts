import { describe, it, expect } from "vitest";
import { referralCode, REFERRAL_REWARD_NGWEE } from "./referrals";

describe("referralCode", () => {
  it("is deterministic for the same name", () => {
    expect(referralCode("Chanda M.")).toBe(referralCode("Chanda M."));
  });

  it("upper cases and strips spaces and punctuation from the base", () => {
    const code = referralCode("Chanda M.");
    expect(code.startsWith("CHANDAM")).toBe(true);
  });

  it("adds a fixed length suffix", () => {
    const code = referralCode("Chanda M.");
    const suffix = code.slice("CHANDAM".length);
    expect(suffix).toHaveLength(4);
  });

  it("gives different codes to different names", () => {
    expect(referralCode("Chanda M.")).not.toBe(referralCode("Mutale K."));
  });

  it("gives different codes to similar names", () => {
    expect(referralCode("Chanda")).not.toBe(referralCode("Chandal"));
  });

  it("only uses A to Z and 0 to 9", () => {
    expect(referralCode("Chanda M.")).toMatch(/^[A-Z0-9]+$/);
  });

  it("handles an empty name without throwing", () => {
    expect(() => referralCode("")).not.toThrow();
  });
});

describe("REFERRAL_REWARD_NGWEE", () => {
  it("is a positive whole number of ngwee", () => {
    expect(Number.isInteger(REFERRAL_REWARD_NGWEE)).toBe(true);
    expect(REFERRAL_REWARD_NGWEE).toBeGreaterThan(0);
  });
});
