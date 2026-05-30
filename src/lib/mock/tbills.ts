import type { IsoDate } from "@/lib/ops/types";

export type TBillTenor = {
  days: 91 | 182 | 273 | 364;
  label: string;
  yieldPercent: number;
  lastAuctionDate: IsoDate;
  nextAuctionDate: IsoDate;
};

export type TBillHolding = {
  id: string;
  tenorDays: TBillTenor["days"];
  faceValueNgwee: number;
  purchaseYieldPercent: number;
  maturityDate: IsoDate;
  /** When true, maturing principal rolls into the next auction at the same tenor. */
  autoRoll: boolean;
};

export const TBILL_TENORS: TBillTenor[] = [
  {
    days: 91,
    label: "91 day",
    yieldPercent: 14.2,
    lastAuctionDate: "2026-05-15",
    nextAuctionDate: "2026-06-12",
  },
  {
    days: 182,
    label: "182 day",
    yieldPercent: 14.8,
    lastAuctionDate: "2026-05-08",
    nextAuctionDate: "2026-06-05",
  },
  {
    days: 273,
    label: "273 day",
    yieldPercent: 15.1,
    lastAuctionDate: "2026-05-01",
    nextAuctionDate: "2026-05-29",
  },
  {
    days: 364,
    label: "364 day",
    yieldPercent: 15.4,
    lastAuctionDate: "2026-04-24",
    nextAuctionDate: "2026-06-19",
  },
];

/** Demo holdings for Chanda M. Two bills with auto-roll on the 91 day tenor. */
export const DEMO_TBILL_HOLDINGS: TBillHolding[] = [
  {
    id: "TB-H01",
    tenorDays: 91,
    faceValueNgwee: 50_000_000,
    purchaseYieldPercent: 13.9,
    maturityDate: "2026-06-12",
    autoRoll: true,
  },
  {
    id: "TB-H02",
    tenorDays: 364,
    faceValueNgwee: 120_000_000,
    purchaseYieldPercent: 15.2,
    maturityDate: "2027-04-18",
    autoRoll: false,
  },
];

export function tenorByDays(days: TBillTenor["days"]): TBillTenor | undefined {
  return TBILL_TENORS.find((t) => t.days === days);
}
