export type TBillTenor = {
  tenorDays: 91 | 182 | 273 | 364;
  label: string;
  yieldPercent: number;
  lastAuctionDate: string;
  nextAuctionDate: string;
  minBidZMW: number;
};

export const TBILL_TENORS: TBillTenor[] = [
  {
    tenorDays: 91,
    label: "91-day",
    yieldPercent: 14.25,
    lastAuctionDate: "2026-04-18",
    nextAuctionDate: "2026-05-09",
    minBidZMW: 1000,
  },
  {
    tenorDays: 182,
    label: "182-day",
    yieldPercent: 15.10,
    lastAuctionDate: "2026-04-18",
    nextAuctionDate: "2026-05-09",
    minBidZMW: 1000,
  },
  {
    tenorDays: 273,
    label: "273-day",
    yieldPercent: 15.75,
    lastAuctionDate: "2026-04-18",
    nextAuctionDate: "2026-05-09",
    minBidZMW: 1000,
  },
  {
    tenorDays: 364,
    label: "364-day",
    yieldPercent: 16.20,
    lastAuctionDate: "2026-04-18",
    nextAuctionDate: "2026-05-09",
    minBidZMW: 1000,
  },
];

export function netYieldAfterWHT(grossYield: number): number {
  return grossYield * (1 - 0.15);
}
