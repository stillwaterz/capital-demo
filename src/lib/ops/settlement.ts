/**
 * T+1 settlement engine.
 *
 * Groups trades into daily settlement batches keyed by settlement date, models
 * delivery versus payment (a net cash leg and a net security-position leg) and
 * surfaces the fail queue. Pure selectors over the trade blotter so the whole
 * view recomputes when the business clock advances. Money is integer ngwee.
 */

import type {
  IsoDate,
  IsoTimestamp,
  Ngwee,
  SettlementBatch,
  SettlementStatus,
  Side,
  Trade,
} from "./types";
import { isSettlementDue } from "./clock";
import { listTrades } from "./trades";

const TENANT_ID = "capital-demo";

function blotter(currentDate: IsoDate, extraTrades: Trade[] = []): Trade[] {
  const base = listTrades(currentDate);
  return extraTrades.length ? [...base, ...extraTrades] : base;
}

/** Cash a buy consumes is its net; a sell releases net cash back to the client. */
function cashImpactNgwee(trade: Trade): Ngwee {
  return trade.side === "BUY" ? -trade.netNgwee : trade.netNgwee;
}

/** Position units a buy adds and a sell removes from the security leg. */
function positionImpactUnits(trade: Trade): number {
  return trade.side === "BUY" ? trade.quantity : -trade.quantity;
}

/** Derive a batch status from the states of its trades. */
function batchStatus(trades: Trade[], settlementDue: boolean): SettlementStatus {
  if (!settlementDue) return "PENDING";
  const failed = trades.filter((t) => t.state === "FAILED").length;
  const settled = trades.filter((t) => t.state === "SETTLED").length;
  if (failed === 0) return "SETTLED";
  if (settled === 0) return "FAILED";
  return "PARTIAL";
}

/**
 * All settlement batches for the current business date, newest settlement date
 * first. One batch per distinct settlement date on the blotter.
 */
export function listSettlementBatches(
  currentDate: IsoDate,
  extraTrades: Trade[] = []
): SettlementBatch[] {
  const trades = blotter(currentDate, extraTrades).filter((t) => t.state !== "NEW");
  const byDate = new Map<IsoDate, Trade[]>();
  for (const trade of trades) {
    const bucket = byDate.get(trade.settlementDate) ?? [];
    bucket.push(trade);
    byDate.set(trade.settlementDate, bucket);
  }

  const batches: SettlementBatch[] = [];
  for (const [settlementDate, batchTrades] of byDate.entries()) {
    const due = isSettlementDue(settlementDate, currentDate);
    const netCashNgwee = batchTrades.reduce(
      (sum, t) => sum + cashImpactNgwee(t),
      0
    );
    const netPositionUnits = batchTrades.reduce(
      (sum, t) => sum + positionImpactUnits(t),
      0
    );
    const settledTrade = batchTrades.find((t) => t.settledAt);
    batches.push({
      id: `BATCH-${settlementDate}`,
      tenantId: TENANT_ID,
      settlementDate,
      tradeIds: batchTrades.map((t) => t.id),
      status: batchStatus(batchTrades, due),
      netCashNgwee,
      netPositionUnits,
      createdAt: `${settlementDate}T06:00:00.000Z`,
      settledAt: due && settledTrade ? settledTrade.settledAt : null,
    });
  }

  return batches.sort((a, b) => (a.settlementDate < b.settlementDate ? 1 : -1));
}

/** Trades that make up a single batch, for the batch drill-down. */
export function tradesInBatch(
  batchId: string,
  currentDate: IsoDate,
  extraTrades: Trade[] = []
): Trade[] {
  const batch = listSettlementBatches(currentDate, extraTrades).find(
    (b) => b.id === batchId
  );
  if (!batch) return [];
  const trades = blotter(currentDate, extraTrades);
  return batch.tradeIds
    .map((id) => trades.find((t) => t.id === id))
    .filter((t): t is Trade => Boolean(t));
}

export type SettlementLeg = {
  /** Which side of delivery versus payment this leg represents. */
  kind: "CASH" | "POSITION";
  label: string;
  /** Cash value in ngwee, or signed unit count for the position leg. */
  value: number;
  /** Direction relative to the broker settlement account. */
  direction: Side;
};

/**
 * The two DvP legs for a batch: the net cash movement and the net security
 * movement. Used by the batch view to show both halves of settlement.
 */
export function settlementLegs(
  batch: SettlementBatch
): [SettlementLeg, SettlementLeg] {
  return [
    {
      kind: "CASH",
      label: "Cash leg",
      value: Math.abs(batch.netCashNgwee),
      direction: batch.netCashNgwee >= 0 ? "SELL" : "BUY",
    },
    {
      kind: "POSITION",
      label: "Security leg",
      value: Math.abs(batch.netPositionUnits),
      direction: batch.netPositionUnits >= 0 ? "BUY" : "SELL",
    },
  ];
}

export type SettlementFail = {
  tradeId: string;
  clientName: string;
  symbol: string;
  side: Side;
  netNgwee: Ngwee;
  settlementDate: IsoDate;
  reason: string;
  detectedAt: IsoTimestamp;
};

/** The settlement fail queue for the current business date. */
export function listSettlementFails(
  currentDate: IsoDate,
  extraTrades: Trade[] = []
): SettlementFail[] {
  return blotter(currentDate, extraTrades)
    .filter((t) => t.state === "FAILED")
    .map((t) => ({
      tradeId: t.id,
      clientName: t.clientName,
      symbol: t.symbol,
      side: t.side,
      netNgwee: t.netNgwee,
      settlementDate: t.settlementDate,
      reason: t.failReason ?? "Settlement failed",
      detectedAt: `${t.settlementDate}T11:05:00.000Z`,
    }));
}

export type SettlementObligation = {
  settlementDate: IsoDate;
  /** Net cash the broker must fund to settle the batch, in ngwee. Positive means an outflow. */
  fundingNeedNgwee: Ngwee;
  tradeCount: number;
};

/**
 * Upcoming settlement obligations (batches not yet due), consumed by the
 * treasury liquidity ladder. A positive funding need is a cash outflow the
 * broker must cover on the settlement date.
 */
export function listUpcomingObligations(
  currentDate: IsoDate,
  extraTrades: Trade[] = []
): SettlementObligation[] {
  return listSettlementBatches(currentDate, extraTrades)
    .filter((b) => b.status === "PENDING")
    .map((b) => ({
      settlementDate: b.settlementDate,
      fundingNeedNgwee: b.netCashNgwee < 0 ? -b.netCashNgwee : 0,
      tradeCount: b.tradeIds.length,
    }))
    .sort((a, b) => (a.settlementDate < b.settlementDate ? -1 : 1));
}

export type SettlementSummary = {
  batchCount: number;
  pendingCount: number;
  settledCount: number;
  failCount: number;
  /** Net cash due to settle across all pending batches, in ngwee (outflow). */
  pendingFundingNgwee: Ngwee;
};

/** Headline settlement counters for the board header and control tower. */
export function settlementSummary(
  currentDate: IsoDate,
  extraTrades: Trade[] = []
): SettlementSummary {
  const batches = listSettlementBatches(currentDate, extraTrades);
  const fails = listSettlementFails(currentDate, extraTrades);
  const pendingFundingNgwee = listUpcomingObligations(
    currentDate,
    extraTrades
  ).reduce(
    (sum, o) => sum + o.fundingNeedNgwee,
    0
  );
  return {
    batchCount: batches.length,
    pendingCount: batches.filter((b) => b.status === "PENDING").length,
    settledCount: batches.filter((b) => b.status === "SETTLED").length,
    failCount: fails.length,
    pendingFundingNgwee,
  };
}
