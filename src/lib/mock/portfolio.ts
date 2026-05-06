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
const tenor91 = TBILL_TENORS.find((t) => t.tenorDays === 91)!;
const tenor182 = TBILL_TENORS.find((t) => t.tenorDays === 182)!;

export const DEMO_PORTFOLIO: Portfolio = {
  displayName: "Chanda M.",
  equities: [
    { instrument: zambeef, sharesHeld: 5000, avgCostNgwee: 352 },
    { instrument: scbl, sharesHeld: 200, avgCostNgwee: 4900 },
    { instrument: atel, sharesHeld: 1000, avgCostNgwee: 2650 },
  ],
  tbills: [
    {
      tenor: tenor91,
      faceValueNgwee: 500_000_00,
      purchaseDate: "2026-02-14",
      maturityDate: "2026-05-16",
      autoRoll: true,
    },
    {
      tenor: tenor182,
      faceValueNgwee: 1_000_000_00,
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
