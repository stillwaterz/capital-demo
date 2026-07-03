/**
 * Per-execution settlement engine (BUILD_SPEC section 9).
 *
 * Settlement runs on a T+n business-day cycle under delivery versus payment: a
 * cash leg and a stock leg that each settle independently. This module is the
 * deterministic core that turns one execution into a settlement record, derives
 * the combined status from the two legs, flags breaks when a due record has not
 * fully settled and produces the plain-English client tracker copy.
 *
 * Pure and side-effect free. No React, no network, no Zustand. Money is integer
 * ngwee. Dates are ISO calendar strings ("YYYY-MM-DD"). The business-day clock
 * and the settlement cycle length are reused from their shared modules so this
 * engine never re-implements holiday or weekend logic.
 */

import { addBusinessDays, isSettlementDue } from "@/lib/ops/clock";
import { SETTLEMENT_CYCLE_DAYS } from "@/lib/config/trading";
import { formatDateZM } from "@/lib/format";
import type { IsoDate, Ngwee } from "@/lib/ops/types";
import type { SettlementLegStatusRow, SettlementRow, Uuid } from "@/lib/db/types";

/** The combined settlement status union carried by a SettlementRow. */
export type SettlementStatus = SettlementRow["status"];

const LEG_PENDING: SettlementLegStatusRow = "pending";
const LEG_SETTLED: SettlementLegStatusRow = "settled";
const LEG_FAILED: SettlementLegStatusRow = "failed";

/**
 * Settlement date for a trade under a T+n business-day cycle. Weekends are
 * skipped by the shared clock. The cycle length is config, not a magic number:
 * it is T+3 today and moves to T+1 by changing SETTLEMENT_CYCLE_DAYS alone.
 */
export function computeSettlementDate(
  tradeDate: IsoDate,
  cycleDays: number = SETTLEMENT_CYCLE_DAYS
): IsoDate {
  return addBusinessDays(tradeDate, cycleDays);
}

/**
 * Combine the two delivery-versus-payment legs into one settlement status.
 * Both settled is settled, any failed leg fails the record, a single settled
 * leg alongside an unsettled one is partial and everything else is pending.
 */
export function deriveSettlementStatus(
  cashLeg: SettlementLegStatusRow,
  stockLeg: SettlementLegStatusRow
): SettlementStatus {
  if (cashLeg === LEG_SETTLED && stockLeg === LEG_SETTLED) return "settled";
  if (cashLeg === LEG_FAILED || stockLeg === LEG_FAILED) return "failed";
  if (cashLeg === LEG_SETTLED || stockLeg === LEG_SETTLED) return "partial";
  return "pending";
}

/**
 * A settlement is a break when it is due (settlement date on or before today)
 * but has not fully settled. Pending or partial due records are breaks; failed
 * due records are breaks too as they still need working.
 */
export function isBreak(record: SettlementRow, today: IsoDate): boolean {
  if (!isSettlementDue(record.settlement_date, today)) return false;
  return record.status !== "settled";
}

/** Every break across the given settlement records for the current date. */
export function listBreaks(
  records: SettlementRow[],
  today: IsoDate
): SettlementRow[] {
  return records.filter((record) => isBreak(record, today));
}

/**
 * Plain-English client tracker line for a settlement. Reads at a Year 9 level
 * in British English: it tells the client the day their shares arrive, or that
 * the shares have already arrived once settlement is due.
 */
export function plainClientTracker(
  settlementDate: IsoDate,
  today: IsoDate
): string {
  if (isSettlementDue(settlementDate, today)) {
    return "Your shares have arrived";
  }
  return `Your shares arrive on ${formatDateZM(settlementDate)}`;
}

/** Execution inputs needed to open a settlement record. */
export type BuildSettlementRecordInput = {
  tenantId: Uuid;
  accountId: Uuid;
  /** The execution being settled. */
  executionId: Uuid;
  tradeDate: IsoDate;
  /** Net cash to move on the cash leg, in ngwee. */
  cashAmountNgwee: Ngwee;
  cycleDays?: number;
};

/** A settlement record before the database assigns its id and timestamps. */
export type NewSettlementRecord = Omit<
  SettlementRow,
  "id" | "created_at" | "updated_at"
>;

/**
 * Assemble a fresh settlement record from an execution. Both legs open as
 * pending, so the combined status opens as pending, and the settlement date is
 * computed from the trade date on the configured T+n cycle.
 */
export function buildSettlementRecord(
  input: BuildSettlementRecordInput
): NewSettlementRecord {
  const cycleDays = input.cycleDays ?? SETTLEMENT_CYCLE_DAYS;
  const cashLegStatus = LEG_PENDING;
  const stockLegStatus = LEG_PENDING;
  return {
    tenant_id: input.tenantId,
    account_id: input.accountId,
    execution_id: input.executionId,
    cycle_days: cycleDays,
    trade_date: input.tradeDate,
    settlement_date: computeSettlementDate(input.tradeDate, cycleDays),
    cash_leg_status: cashLegStatus,
    stock_leg_status: stockLegStatus,
    status: deriveSettlementStatus(cashLegStatus, stockLegStatus),
  };
}
