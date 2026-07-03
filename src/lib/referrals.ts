import type { Ngwee } from "@/lib/ops/types";

/** Cash bonus paid to a referrer when their friend funds an account. */
export const REFERRAL_REWARD_NGWEE: Ngwee = 5000;

/** Length of the stable suffix added to a referral code. */
const SUFFIX_LENGTH = 4;

/** Radix used to render the hash as base 36 digits and letters. */
const BASE_36 = 36;

/** Multiplier for a simple deterministic string hash. */
const HASH_MULTIPLIER = 31;

/** Keeps the running hash inside a safe positive integer range. */
const HASH_MODULO = 2147483647;

/** Strip everything except A to Z and 0 to 9, then upper case. */
function normalise(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Deterministic non-negative hash of a string. No Math.random, no Date. */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * HASH_MULTIPLIER + input.charCodeAt(i)) % HASH_MODULO;
  }
  return hash;
}

/**
 * A stable, shareable referral code for a name. The same name always gives
 * the same code. The suffix is derived from the full name so two people with
 * similar names get different codes.
 */
export function referralCode(name: string): string {
  const base = normalise(name);
  const suffix = hashString(name)
    .toString(BASE_36)
    .toUpperCase()
    .padStart(SUFFIX_LENGTH, "0")
    .slice(-SUFFIX_LENGTH);
  return `${base}${suffix}`;
}
