/**
 * Order maths: two inputs, one result (BUILD_SPEC section 5).
 *
 * A client either says "Buy 500 shares" (quantity mode) or "Buy K1,000 of
 * ZANACO" (value mode). Both normalise to a whole-lot share count and a Kwacha
 * total. LuSE equities trade in whole board lots, so quantity snaps to a
 * multiple of the board lot and value rounds down to the largest whole lot that
 * fits, leaving the remainder in the wallet. We never pretend the exact round
 * amount was spent.
 *
 * Everything here is pure and deterministic. Money is integer ngwee. Fees come
 * from the shared fee engine, they are not reinvented here.
 */

import type { AssetClass, Ngwee, Side } from "@/lib/ops/types";
import { computeTradeFees, type TradeFeeBreakdown } from "@/lib/ops/trades";
import { DEFAULT_BOARD_LOT } from "@/lib/config/trading";

/** How the client expressed the order: a share count or a Kwacha budget. */
export type OrderInputMode = "quantity" | "value";

/**
 * Market orders price against last traded price and the total is an estimate.
 * Limit orders price at an exact limit so the maths is a promise, not a guess.
 */
export type OrderPriceType = "market" | "limit";

export type ResolveOrderParams = {
  side: Side;
  assetClass: AssetClass;
  mode: OrderInputMode;
  priceType: OrderPriceType;
  /** Last traded price per share in ngwee, used for market orders. */
  lastPriceNgwee: Ngwee;
  /** Limit price per share in ngwee. Falls back to last price when omitted. */
  limitPriceNgwee?: Ngwee;
  /** Requested share count for quantity mode. */
  quantity?: number;
  /** Kwacha budget in ngwee for value mode. */
  valueNgwee?: Ngwee;
  /** Board lot size. Defaults to the LuSE standard lot. */
  boardLot?: number;
};

export type ResolvedOrder = {
  /** Whole-lot share count after snapping or rounding down. */
  resolvedQty: number;
  /** resolvedQty * effective price, in ngwee. */
  grossNgwee: Ngwee;
  /** Fee breakdown from the shared fee engine. */
  fees: TradeFeeBreakdown;
  /**
   * All-in cash for a buy (gross plus total fees) or net proceeds for a sell
   * (gross minus total fees), in ngwee.
   */
  allInNgwee: Ngwee;
  /** Value-mode budget left unspent and returned to the wallet, in ngwee. */
  remainderNgwee: Ngwee;
  /** True for market orders (estimate), false for limit orders (exact). */
  isEstimate: boolean;
};

/** Zero fee breakdown used when there is nothing to trade. */
const ZERO_FEES: TradeFeeBreakdown = {
  brokerageNgwee: 0,
  levyNgwee: 0,
  csdNgwee: 0,
  totalNgwee: 0,
};

/** Snap a requested share count to the nearest whole multiple of the board lot. */
export function snapToLot(qty: number, boardLot: number): number {
  if (boardLot <= 0 || qty <= 0) return 0;
  return Math.round(qty / boardLot) * boardLot;
}

/**
 * Largest whole-lot share count whose gross cost fits inside the budget.
 * Rounds down so we never overspend the client's stated Kwacha amount.
 */
export function largestLotValue(
  valueNgwee: Ngwee,
  priceNgwee: Ngwee,
  boardLot: number
): number {
  if (valueNgwee <= 0 || priceNgwee <= 0 || boardLot <= 0) return 0;
  const lotCostNgwee = priceNgwee * boardLot;
  const wholeLots = Math.floor(valueNgwee / lotCostNgwee);
  return wholeLots * boardLot;
}

/** Price per share the order should transact at, in ngwee. */
function effectivePriceNgwee(params: ResolveOrderParams): Ngwee {
  if (params.priceType === "limit") {
    return params.limitPriceNgwee ?? params.lastPriceNgwee;
  }
  return params.lastPriceNgwee;
}

/** Resolve a raw client order into a whole-lot share count and a Kwacha total. */
export function resolveOrder(params: ResolveOrderParams): ResolvedOrder {
  const priceNgwee = effectivePriceNgwee(params);
  const boardLot = params.boardLot ?? DEFAULT_BOARD_LOT;
  const isEstimate = params.priceType === "market";

  const resolvedQty =
    priceNgwee > 0
      ? params.mode === "quantity"
        ? snapToLot(params.quantity ?? 0, boardLot)
        : largestLotValue(params.valueNgwee ?? 0, priceNgwee, boardLot)
      : 0;

  const grossNgwee = resolvedQty * priceNgwee;
  const fees =
    resolvedQty > 0 ? computeTradeFees(grossNgwee, params.assetClass) : ZERO_FEES;
  const allInNgwee =
    params.side === "BUY"
      ? grossNgwee + fees.totalNgwee
      : grossNgwee - fees.totalNgwee;
  const remainderNgwee =
    params.mode === "value"
      ? Math.max((params.valueNgwee ?? 0) - grossNgwee, 0)
      : 0;

  return { resolvedQty, grossNgwee, fees, allInNgwee, remainderNgwee, isEstimate };
}
