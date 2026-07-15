/**
 * Fees and tax engine.
 *
 * The commission schedule, brokerage, levy and CSD fee runs aggregated from
 * settled trades, and a 15 percent withholding tax register that captures tax
 * withheld from dividend and coupon income for remittance to ZRA. Pure
 * selectors over the trade blotter and corporate-action calendar. Money is
 * integer ngwee.
 */

import type {
  AssetClass,
  FeeRun,
  FeeType,
  IsoDate,
  Ngwee,
  RemittanceStatus,
  WhtRemittance,
} from "./types";
import { isAfter } from "./clock";
import {
  computeTradeFees,
  CSD_FEE_NGWEE,
  EQUITY_BROKERAGE_BPS,
  EQUITY_LEVY_BPS,
  GOVT_BROKERAGE_BPS,
  listSettledTrades,
  WHT_BPS,
} from "./trades";
import { listProcessedActions } from "./corporate-actions";

const TENANT_ID = "capital-demo";

export type CommissionScheduleRow = {
  label: string;
  assetClass: AssetClass | "ALL";
  feeType: FeeType;
  /** Plain English rate, for example "1.00% of consideration". */
  rate: string;
  basis: "BPS" | "FLAT";
};

/** The published commission and levy schedule shown on the fees screen. */
export const COMMISSION_SCHEDULE: readonly CommissionScheduleRow[] = [
  {
    label: "Equity brokerage",
    assetClass: "EQUITY",
    feeType: "BROKERAGE",
    rate: `${(EQUITY_BROKERAGE_BPS / 100).toFixed(2)}% of consideration`,
    basis: "BPS",
  },
  {
    label: "LuSE and SEC levy",
    assetClass: "EQUITY",
    feeType: "LEVY",
    rate: `${(EQUITY_LEVY_BPS / 100).toFixed(2)}% of consideration`,
    basis: "BPS",
  },
  {
    label: "CSD settlement fee",
    assetClass: "EQUITY",
    feeType: "CSD",
    rate: "ZMW 5.00 per trade",
    basis: "FLAT",
  },
  {
    label: "Government bond brokerage",
    assetClass: "BOND",
    feeType: "BROKERAGE",
    rate: `${(GOVT_BROKERAGE_BPS / 100).toFixed(2)}% of consideration`,
    basis: "BPS",
  },
  {
    label: "Withholding tax on income",
    assetClass: "ALL",
    feeType: "WHT",
    rate: `${(WHT_BPS / 100).toFixed(0)}% of dividend and coupon income`,
    basis: "BPS",
  },
];

type FeeAccumulator = { itemCount: number; totalNgwee: Ngwee };

function emptyAcc(): FeeAccumulator {
  return { itemCount: 0, totalNgwee: 0 };
}

/**
 * Brokerage, levy and CSD fee runs, one per settlement date and fee type,
 * aggregated from settled trades. CSD_FEE_NGWEE keeps the per-trade flat fee
 * visible in the schedule above.
 */
export function listFeeRuns(currentDate: IsoDate): FeeRun[] {
  const byDate = new Map<IsoDate, Record<FeeType, FeeAccumulator>>();

  for (const trade of listSettledTrades(currentDate)) {
    const fees = computeTradeFees(trade.grossNgwee, trade.assetClass);
    const bucket =
      byDate.get(trade.settlementDate) ??
      ({
        BROKERAGE: emptyAcc(),
        LEVY: emptyAcc(),
        CSD: emptyAcc(),
        WHT: emptyAcc(),
      } satisfies Record<FeeType, FeeAccumulator>);

    if (fees.brokerageNgwee > 0) {
      bucket.BROKERAGE.itemCount += 1;
      bucket.BROKERAGE.totalNgwee += fees.brokerageNgwee;
    }
    if (fees.levyNgwee > 0) {
      bucket.LEVY.itemCount += 1;
      bucket.LEVY.totalNgwee += fees.levyNgwee;
    }
    if (fees.csdNgwee > 0) {
      bucket.CSD.itemCount += 1;
      bucket.CSD.totalNgwee += fees.csdNgwee;
    }
    byDate.set(trade.settlementDate, bucket);
  }

  const runs: FeeRun[] = [];
  for (const [date, buckets] of byDate.entries()) {
    for (const feeType of ["BROKERAGE", "LEVY", "CSD"] as const) {
      const acc = buckets[feeType];
      if (acc.itemCount === 0) continue;
      runs.push({
        id: `FEE-${feeType}-${date}`,
        tenantId: TENANT_ID,
        date,
        type: feeType,
        itemCount: acc.itemCount,
        totalNgwee: acc.totalNgwee,
        postedToLedger: true,
      });
    }
  }

  return runs.sort((a, b) =>
    a.date === b.date ? a.type.localeCompare(b.type) : a.date < b.date ? 1 : -1
  );
}

/** Fee runs of a single type. */
export function listFeeRunsByType(
  type: FeeType,
  currentDate: IsoDate
): FeeRun[] {
  return listFeeRuns(currentDate).filter((r) => r.type === type);
}

/** Total brokerage, levy and CSD fees captured, in ngwee. */
export function totalFeesNgwee(currentDate: IsoDate): Ngwee {
  return listFeeRuns(currentDate).reduce((s, r) => s + r.totalNgwee, 0);
}

// ---------------------------------------------------------------------------
// Withholding tax register
// ---------------------------------------------------------------------------

/** Build the ZRA remittance due date: the 14th of the month after the period. */
function remittanceDueDate(period: string): IsoDate {
  const [year, month] = period.split("-").map((p) => Number(p));
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-14`;
}

function remittanceStatus(dueDate: IsoDate, currentDate: IsoDate): RemittanceStatus {
  return isAfter(currentDate, dueDate) ? "OVERDUE" : "DUE";
}

/**
 * WHT remittance register, one row per monthly period, aggregating tax withheld
 * from processed dividend and coupon events. All rows sit DUE in the demo until
 * the period close, then OVERDUE once the due date passes.
 */
export function listWhtRemittances(currentDate: IsoDate): WhtRemittance[] {
  const byPeriod = new Map<string, Ngwee>();
  for (const action of listProcessedActions(currentDate)) {
    if (action.whtNgwee === 0) continue;
    const period = action.payDate.slice(0, 7);
    byPeriod.set(period, (byPeriod.get(period) ?? 0) + action.whtNgwee);
  }

  return [...byPeriod.entries()]
    .map(([period, amountNgwee]) => {
      const dueDate = remittanceDueDate(period);
      return {
        id: `WHT-${period}`,
        tenantId: TENANT_ID,
        period,
        amountNgwee,
        dueDate,
        status: remittanceStatus(dueDate, currentDate),
        remittedAt: null,
      } satisfies WhtRemittance;
    })
    .sort((a, b) => (a.period < b.period ? -1 : 1));
}

/** Total withholding tax payable to ZRA across all open periods, in ngwee. */
export function totalWhtPayableNgwee(currentDate: IsoDate): Ngwee {
  return listWhtRemittances(currentDate)
    .filter((r) => r.status !== "REMITTED")
    .reduce((s, r) => s + r.amountNgwee, 0);
}

export type FeesSummary = {
  feeRunCount: number;
  totalFeesNgwee: Ngwee;
  whtPayableNgwee: Ngwee;
  remittanceCount: number;
};

/** Headline fees and tax counters for the control tower. */
export function feesSummary(currentDate: IsoDate): FeesSummary {
  const remittances = listWhtRemittances(currentDate);
  return {
    feeRunCount: listFeeRuns(currentDate).length,
    totalFeesNgwee: totalFeesNgwee(currentDate),
    whtPayableNgwee: totalWhtPayableNgwee(currentDate),
    remittanceCount: remittances.length,
  };
}
