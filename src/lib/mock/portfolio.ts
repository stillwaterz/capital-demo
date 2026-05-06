import { type Instrument, INSTRUMENTS } from "./instruments";
import { type TBillTenor, TBILL_TENORS, netYieldAfterWHT } from "./tbills";

export type EquityHolding = {
  instrument: Instrument;
  sharesHeld: number;
  avgCostNgwee: number;
};

export type TBillHolding = {
  tenor: TBillTenor;
  faceValueNgwee: number;
  purchaseDate: string;
  maturityDate: string;
  autoRoll: boolean;
};

export type Portfolio = {
  displayName: string;
  equities: EquityHolding[];
  tbills: TBillHolding[];
};

const zambeef = INSTRUMENTS.find((i) => i.symbol === "ZAMBEEF")!;
const scbl = INSTRUMENTS.find((i) => i.symbol === "SCBL")!;
const atel = INSTRUMENTS.find((i) => i.symbol === "ATEL")!;
const cec = INSTRUMENTS.find((i) => i.symbol === "CEC")!;
const tenor91 = TBILL_TENORS.find((t) => t.tenorDays === 91)!;
const tenor182 = TBILL_TENORS.find((t) => t.tenorDays === 182)!;

// Portfolio worth approx ZMW 1.5 million (equities + T-bills)
// ZAMBEEF 10,000 @ 3.90 = ZMW 39,000
// SCBL    2,000 @ 52.00 = ZMW 104,000
// ATEL   30,000 @ 28.50 = ZMW 855,000
// CEC     2,500 @ 145.00 = ZMW 362,500
// T-bills ZMW 50,000 + ZMW 100,000
// Total  ~ZMW 1,510,500
export const DEMO_PORTFOLIO: Portfolio = {
  displayName: "Chanda M.",
  equities: [
    { instrument: zambeef, sharesHeld: 10_000, avgCostNgwee: 352 },
    { instrument: scbl,    sharesHeld: 2_000,  avgCostNgwee: 4_900 },
    { instrument: atel,    sharesHeld: 30_000, avgCostNgwee: 2_650 },
    { instrument: cec,     sharesHeld: 2_500,  avgCostNgwee: 13_800 },
  ],
  tbills: [
    {
      tenor: tenor91,
      faceValueNgwee: 5_000_000,
      purchaseDate: "2026-02-14",
      maturityDate: "2026-05-16",
      autoRoll: true,
    },
    {
      tenor: tenor182,
      faceValueNgwee: 10_000_000,
      purchaseDate: "2026-01-10",
      maturityDate: "2026-07-11",
      autoRoll: false,
    },
  ],
};

export function portfolioTotalNgwee(portfolio: Portfolio): number {
  const equityTotal = portfolio.equities.reduce(
    (sum, h) => sum + h.sharesHeld * h.instrument.lastPriceNgwee,
    0
  );
  const tbillTotal = portfolio.tbills.reduce(
    (sum, h) => sum + h.faceValueNgwee,
    0
  );
  return equityTotal + tbillTotal;
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

export { netYieldAfterWHT };
