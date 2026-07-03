import { type Instrument, INSTRUMENTS } from "./instruments";

export type EquityHolding = {
  instrument: Instrument;
  sharesHeld: number;
  avgCostNgwee: number;
};

export type Portfolio = {
  displayName: string;
  equities: EquityHolding[];
};

const zambeef = INSTRUMENTS.find((i) => i.symbol === "ZAMBEEF")!;
const scbl = INSTRUMENTS.find((i) => i.symbol === "SCBL")!;
const atel = INSTRUMENTS.find((i) => i.symbol === "ATEL")!;
const cec = INSTRUMENTS.find((i) => i.symbol === "CEC")!;

// Portfolio worth approx ZMW 1.36 million (equities only)
// ZAMBEEF 10,000 @ 3.90 = ZMW 39,000
// SCBL    2,000 @ 52.00 = ZMW 104,000
// ATEL   30,000 @ 28.50 = ZMW 855,000
// CEC     2,500 @ 145.00 = ZMW 362,500
// Total  ~ZMW 1,360,500
export const DEMO_PORTFOLIO: Portfolio = {
  displayName: "Chanda M.",
  equities: [
    { instrument: zambeef, sharesHeld: 10_000, avgCostNgwee: 352 },
    { instrument: scbl,    sharesHeld: 2_000,  avgCostNgwee: 4_900 },
    { instrument: atel,    sharesHeld: 30_000, avgCostNgwee: 2_650 },
    { instrument: cec,     sharesHeld: 2_500,  avgCostNgwee: 13_800 },
  ],
};

export function portfolioTotalNgwee(portfolio: Portfolio): number {
  return portfolio.equities.reduce(
    (sum, h) => sum + h.sharesHeld * h.instrument.lastPriceNgwee,
    0
  );
}

export function holdingCurrentValueNgwee(holding: EquityHolding): number {
  return holding.sharesHeld * holding.instrument.lastPriceNgwee;
}

export function holdingCostNgwee(holding: EquityHolding): number {
  return holding.sharesHeld * holding.avgCostNgwee;
}

export function holdingPnLPercent(holding: EquityHolding): number {
  const cost = holdingCostNgwee(holding);
  return cost === 0
    ? 0
    : ((holdingCurrentValueNgwee(holding) - cost) / cost) * 100;
}

/** Absolute gain or loss on a holding, in ngwee. */
export function holdingPnLNgwee(holding: EquityHolding): number {
  return holdingCurrentValueNgwee(holding) - holdingCostNgwee(holding);
}

/** Total cost basis across the portfolio, in ngwee. */
export function portfolioCostNgwee(portfolio: Portfolio): number {
  return portfolio.equities.reduce((sum, h) => sum + holdingCostNgwee(h), 0);
}

/** Total gain or loss across the portfolio, in ngwee. */
export function portfolioPnLNgwee(portfolio: Portfolio): number {
  return portfolioTotalNgwee(portfolio) - portfolioCostNgwee(portfolio);
}

/** Total gain or loss across the portfolio, as a percentage. */
export function portfolioPnLPercent(portfolio: Portfolio): number {
  const cost = portfolioCostNgwee(portfolio);
  return cost === 0 ? 0 : (portfolioPnLNgwee(portfolio) / cost) * 100;
}
