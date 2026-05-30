/**
 * Treasury, float and FX engine.
 *
 * Float positions across the six payment rails, a liquidity ladder that lines
 * available float up against upcoming settlement obligations, ZMW/USD FX for
 * diaspora funding, and a flagged pre-settlement shortfall. Pure selectors over
 * the settlement engine so the ladder recomputes when the clock advances. Money
 * is integer ngwee.
 */

import type {
  FloatAccount,
  FxRate,
  IsoDate,
  IsoTimestamp,
  Ngwee,
  Rail,
} from "./types";
import { listUpcomingObligations } from "./settlement";

const TENANT_ID = "capital-demo";
const FLOAT_AS_OF: IsoTimestamp = "2026-05-29T07:00:00.000Z";

type FloatSeed = {
  rail: Rail;
  name: string;
  balanceNgwee: Ngwee;
  minBufferNgwee: Ngwee;
};

/**
 * Float held across the payment rails. Total available float is set just below
 * the next settlement obligation so the demo surfaces a pre-settlement
 * shortfall the treasury desk has to clear.
 */
const FLOAT_SEEDS: readonly FloatSeed[] = [
  { rail: "AIRTEL", name: "Airtel Money float", balanceNgwee: 2_500_000, minBufferNgwee: 500_000 },
  { rail: "MTN", name: "MTN MoMo float", balanceNgwee: 3_000_000, minBufferNgwee: 500_000 },
  { rail: "FNB", name: "FNB operating account", balanceNgwee: 3_000_000, minBufferNgwee: 1_000_000 },
  { rail: "ZANACO", name: "Zanaco operating account", balanceNgwee: 3_500_000, minBufferNgwee: 800_000 },
  { rail: "STANBIC", name: "Stanbic operating account", balanceNgwee: 2_000_000, minBufferNgwee: 500_000 },
  { rail: "SETTLEMENT", name: "CSD settlement account", balanceNgwee: 1_500_000, minBufferNgwee: 0 },
];

/** Float accounts across all rails. */
export function listFloatAccounts(): FloatAccount[] {
  return FLOAT_SEEDS.map((seed) => ({
    id: `FLOAT-${seed.rail}`,
    tenantId: TENANT_ID,
    rail: seed.rail,
    name: seed.name,
    balanceNgwee: seed.balanceNgwee,
    minBufferNgwee: seed.minBufferNgwee,
    updatedAt: FLOAT_AS_OF,
  }));
}

export type FloatSummary = {
  totalBalanceNgwee: Ngwee;
  totalBufferNgwee: Ngwee;
  /** Float deployable for settlement after holding minimum buffers, in ngwee. */
  availableNgwee: Ngwee;
};

export function floatSummary(): FloatSummary {
  const accounts = listFloatAccounts();
  const totalBalanceNgwee = accounts.reduce((s, a) => s + a.balanceNgwee, 0);
  const totalBufferNgwee = accounts.reduce((s, a) => s + a.minBufferNgwee, 0);
  return {
    totalBalanceNgwee,
    totalBufferNgwee,
    availableNgwee: totalBalanceNgwee - totalBufferNgwee,
  };
}

export type LiquidityLadderRow = {
  settlementDate: IsoDate;
  /** Cash the broker must fund on this date, in ngwee. */
  obligationNgwee: Ngwee;
  /** Running total of obligations up to and including this date, in ngwee. */
  cumulativeNgwee: Ngwee;
  /** True when available float still covers the cumulative obligation. */
  covered: boolean;
  tradeCount: number;
};

/**
 * Liquidity ladder: upcoming settlement obligations stacked against available
 * float. Each row shows the cumulative funding need and whether float still
 * covers it.
 */
export function liquidityLadder(currentDate: IsoDate): LiquidityLadderRow[] {
  const available = floatSummary().availableNgwee;
  let cumulative = 0;
  return listUpcomingObligations(currentDate).map((obligation) => {
    cumulative += obligation.fundingNeedNgwee;
    return {
      settlementDate: obligation.settlementDate,
      obligationNgwee: obligation.fundingNeedNgwee,
      cumulativeNgwee: cumulative,
      covered: cumulative <= available,
      tradeCount: obligation.tradeCount,
    };
  });
}

export type TreasuryShortfall = {
  hasShortfall: boolean;
  /** Settlement date the shortfall first bites, or null when none. */
  settlementDate: IsoDate | null;
  requiredNgwee: Ngwee;
  availableNgwee: Ngwee;
  shortfallNgwee: Ngwee;
  /** Suggested float top-up to clear the shortfall with headroom, in ngwee. */
  recommendedTopUpNgwee: Ngwee;
};

/** Headroom added on top of a shortfall when recommending a top-up (10%). */
const TOPUP_HEADROOM_BPS = 1_000;

/**
 * Pre-settlement shortfall check: the largest cumulative obligation against
 * available float. Flags the date funding first falls short.
 */
export function treasuryShortfall(currentDate: IsoDate): TreasuryShortfall {
  const available = floatSummary().availableNgwee;
  const ladder = liquidityLadder(currentDate);
  const peak = ladder.reduce(
    (max, row) => (row.cumulativeNgwee > max.cumulativeNgwee ? row : max),
    { cumulativeNgwee: 0, settlementDate: null as IsoDate | null }
  );
  const requiredNgwee = peak.cumulativeNgwee;
  const shortfallNgwee = Math.max(requiredNgwee - available, 0);
  const hasShortfall = shortfallNgwee > 0;
  const recommendedTopUpNgwee = hasShortfall
    ? shortfallNgwee + Math.round((shortfallNgwee * TOPUP_HEADROOM_BPS) / 10_000)
    : 0;
  return {
    hasShortfall,
    settlementDate: hasShortfall ? peak.settlementDate : null,
    requiredNgwee,
    availableNgwee: available,
    shortfallNgwee,
    recommendedTopUpNgwee,
  };
}

// ---------------------------------------------------------------------------
// FX for diaspora funding
// ---------------------------------------------------------------------------

/** Reference FX rates. rateMicros = units of quote per 1 unit of base, x1e6. */
const FX_RATES: readonly FxRate[] = [
  {
    id: "FX-USDZMW",
    base: "USD",
    quote: "ZMW",
    rateMicros: 27_500_000,
    asOf: FLOAT_AS_OF,
  },
  {
    id: "FX-GBPZMW",
    base: "GBP",
    quote: "ZMW",
    rateMicros: 34_800_000,
    asOf: FLOAT_AS_OF,
  },
];

export function listFxRates(): FxRate[] {
  return [...FX_RATES];
}

export function getFxRate(base: string, quote: string): FxRate | undefined {
  return FX_RATES.find((r) => r.base === base && r.quote === quote);
}

/**
 * Convert a foreign-currency minor-unit amount (for example US cents) into
 * ngwee using the reference rate. Returns 0 when no rate is available.
 */
export function convertToNgwee(
  amountMinor: number,
  base: string
): Ngwee {
  const rate = getFxRate(base, "ZMW");
  if (!rate) return 0;
  // amountMinor is in 1/100 of the base unit; ngwee is 1/100 ZMW, so the
  // 1/100 scale cancels and only the FX micros conversion remains.
  return Math.round((amountMinor * rate.rateMicros) / 1_000_000);
}

export type TreasurySummary = {
  availableFloatNgwee: Ngwee;
  upcomingObligationNgwee: Ngwee;
  hasShortfall: boolean;
  shortfallNgwee: Ngwee;
  usdZmwRateMicros: number;
};

/** Headline treasury counters for the control tower. */
export function treasurySummary(currentDate: IsoDate): TreasurySummary {
  const shortfall = treasuryShortfall(currentDate);
  const usd = getFxRate("USD", "ZMW");
  return {
    availableFloatNgwee: floatSummary().availableNgwee,
    upcomingObligationNgwee: shortfall.requiredNgwee,
    hasShortfall: shortfall.hasShortfall,
    shortfallNgwee: shortfall.shortfallNgwee,
    usdZmwRateMicros: usd?.rateMicros ?? 0,
  };
}
