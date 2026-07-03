/**
 * Order lifecycle state machine and pre-trade guardrails (BUILD_SPEC section 4).
 *
 * The "rules engine disposes" core: a deterministic map of which order status
 * may follow which, plus the reason-coded pre-trade checks that must pass
 * before an order is queued. No React, no I/O. Money is integer ngwee.
 *
 * An order walks draft -> confirmed -> cooling_off -> queued -> staged ->
 * working, then fills, cancels, is rejected or expires. LuSE rules permit
 * cancellation any time before execution, so the client may cancel from queued,
 * staged or working while unfilled and the cancel is real, never a fake timer.
 */

import type { Ngwee, Side } from "@/lib/ops/types";
import { ngweeBps } from "@/lib/ops/trades";

/** Every status an order can hold, in lifecycle order. */
export const ORDER_STATUSES = [
  "draft",
  "confirmed",
  "cooling_off",
  "queued",
  "staged",
  "working",
  "partially_filled",
  "filled",
  "cancelled",
  "rejected",
  "expired",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Allowed forward transitions per status. Terminal states (filled, cancelled,
 * rejected, expired) have no exits.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["cooling_off", "cancelled"],
  cooling_off: ["queued", "cancelled", "rejected"],
  queued: ["staged", "cancelled", "rejected", "expired"],
  staged: ["working", "cancelled", "rejected", "expired"],
  working: ["partially_filled", "filled", "cancelled", "expired"],
  partially_filled: ["filled", "cancelled", "expired"],
  filled: [],
  cancelled: [],
  rejected: [],
  expired: [],
};

/** True when an order may move directly from one status to another. */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** The statuses an order in the given status may move to next. */
export function nextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return ORDER_TRANSITIONS[from];
}

/** Statuses from which a client may cancel an unfilled order. */
const CANCELLABLE_STATUSES: readonly OrderStatus[] = [
  "queued",
  "staged",
  "working",
];

/** True when the client may cancel an order in this status. */
export function isCancellable(status: OrderStatus): boolean {
  return CANCELLABLE_STATUSES.includes(status);
}

// ---------------------------------------------------------------------------
// Pre-trade checks
// ---------------------------------------------------------------------------

/** Default sanity band around last price for a limit, in basis points (10%). */
export const DEFAULT_PRICE_BAND_BPS = 1000;

export type PreTradeReasonCode =
  | "INSUFFICIENT_CASH"
  | "INSUFFICIENT_HOLDINGS"
  | "NOT_WHOLE_LOT"
  | "PRICE_OUT_OF_BAND";

/** Result of a single pre-trade check. */
export type CheckResult = {
  ok: boolean;
  reasonCode?: PreTradeReasonCode;
};

/** Plain English message shown when a check fails. */
export const REASON_MESSAGES: Record<PreTradeReasonCode, string> = {
  INSUFFICIENT_CASH: "Not enough wallet cash for this buy including fees",
  INSUFFICIENT_HOLDINGS: "Not enough holdings to sell without going short",
  NOT_WHOLE_LOT: "Quantity must be a whole multiple of the board lot",
  PRICE_OUT_OF_BAND: "Price is outside the sanity band around last price",
};

/** Enough wallet cash to cover the all-in cost of a buy. */
export function hasCashForBuy(
  walletNgwee: Ngwee,
  allInNgwee: Ngwee
): CheckResult {
  if (walletNgwee >= allInNgwee) return { ok: true };
  return { ok: false, reasonCode: "INSUFFICIENT_CASH" };
}

/** Enough actual holdings to cover a sell so the client never goes short. */
export function hasHoldingsForSell(heldQty: number, qty: number): CheckResult {
  if (qty > 0 && heldQty >= qty) return { ok: true };
  return { ok: false, reasonCode: "INSUFFICIENT_HOLDINGS" };
}

/** Quantity is a positive whole multiple of the board lot. */
export function isWholeLot(qty: number, boardLot: number): CheckResult {
  if (boardLot > 0 && qty > 0 && qty % boardLot === 0) return { ok: true };
  return { ok: false, reasonCode: "NOT_WHOLE_LOT" };
}

/** Price sits within a basis-point band either side of last traded price. */
export function isPriceWithinBand(
  priceNgwee: Ngwee,
  lastPriceNgwee: Ngwee,
  bandBps: number = DEFAULT_PRICE_BAND_BPS
): CheckResult {
  if (lastPriceNgwee <= 0 || priceNgwee <= 0) {
    return { ok: false, reasonCode: "PRICE_OUT_OF_BAND" };
  }
  const toleranceNgwee = ngweeBps(lastPriceNgwee, bandBps);
  if (Math.abs(priceNgwee - lastPriceNgwee) <= toleranceNgwee) {
    return { ok: true };
  }
  return { ok: false, reasonCode: "PRICE_OUT_OF_BAND" };
}

export type PreTradeCheckParams = {
  side: Side;
  walletNgwee: Ngwee;
  allInNgwee: Ngwee;
  heldQty: number;
  qty: number;
  boardLot: number;
  priceNgwee: Ngwee;
  lastPriceNgwee: Ngwee;
  bandBps?: number;
};

export type PreTradeFailure = {
  reasonCode: PreTradeReasonCode;
  message: string;
};

export type PreTradeResult = {
  ok: boolean;
  failures: PreTradeFailure[];
};

/** Push a failed check onto the failures list with its message. */
function collectFailure(result: CheckResult, failures: PreTradeFailure[]): void {
  if (!result.ok && result.reasonCode) {
    failures.push({
      reasonCode: result.reasonCode,
      message: REASON_MESSAGES[result.reasonCode],
    });
  }
}

/** Run every pre-trade guardrail and aggregate the reason-coded failures. */
export function runPreTradeChecks(params: PreTradeCheckParams): PreTradeResult {
  const failures: PreTradeFailure[] = [];

  collectFailure(isWholeLot(params.qty, params.boardLot), failures);
  collectFailure(
    isPriceWithinBand(params.priceNgwee, params.lastPriceNgwee, params.bandBps),
    failures
  );
  if (params.side === "BUY") {
    collectFailure(hasCashForBuy(params.walletNgwee, params.allInNgwee), failures);
  } else {
    collectFailure(hasHoldingsForSell(params.heldQty, params.qty), failures);
  }

  return { ok: failures.length === 0, failures };
}
