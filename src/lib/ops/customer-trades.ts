/**
 * Converts customer-app orders into ops Trade records so front-to-back flow
 * is visible on the settlement board. Pure given (orders, currentDate).
 */

import type { CustomerOrder } from "@/lib/store/customer-orders";
import type { AssetClass, IsoDate, Trade, TradeState } from "./types";
import { isSettlementDue, nextSettlementDate } from "./clock";
import { computeTradeFees } from "./trades";

const TENANT_ID = "capital-demo";
const DEMO_CLIENT_ID = "C001";

function assetClassForSymbol(symbol: string): AssetClass {
  if (symbol.startsWith("GRZ-B")) return "BOND";
  return "EQUITY";
}

function deriveCustomerTradeState(tradeDate: IsoDate, currentDate: IsoDate): TradeState {
  if (currentDate < tradeDate) return "NEW";
  const settlementDate = nextSettlementDate(tradeDate);
  if (isSettlementDue(settlementDate, currentDate)) return "SETTLED";
  return "EXECUTED";
}

/** Materialise one customer order as an ops Trade for the given business date. */
export function customerOrderToTrade(
  order: CustomerOrder,
  currentDate: IsoDate
): Trade {
  const assetClass = assetClassForSymbol(order.symbol);
  const grossNgwee = order.quantity * order.priceNgwee;
  const fees = computeTradeFees(grossNgwee, assetClass);
  const feesNgwee = fees.totalNgwee;
  const netNgwee =
    order.side === "BUY" ? grossNgwee + feesNgwee : grossNgwee - feesNgwee;
  const settlementDate = nextSettlementDate(order.tradeDate);
  const state = deriveCustomerTradeState(order.tradeDate, currentDate);
  const executedAt =
    state === "NEW" ? null : `${order.tradeDate}T09:30:00.000Z`;
  const settledAt =
    state === "SETTLED" ? `${settlementDate}T11:00:00.000Z` : null;

  return {
    id: order.id,
    tenantId: TENANT_ID,
    clientId: DEMO_CLIENT_ID,
    clientName: order.clientName,
    symbol: order.symbol,
    assetClass,
    side: order.side,
    quantity: order.quantity,
    priceNgwee: order.priceNgwee,
    grossNgwee,
    feesNgwee,
    netNgwee,
    state,
    counterparty: "Pangaea Securities",
    tradeDate: order.tradeDate,
    settlementDate,
    executedAt,
    settledAt,
    failReason: null,
  };
}

/** Merge seed blotter trades with customer-initiated orders. */
export function mergeCustomerTrades(
  baseTrades: Trade[],
  orders: CustomerOrder[],
  currentDate: IsoDate
): Trade[] {
  if (orders.length === 0) return baseTrades;
  const customerTrades = orders.map((o) => customerOrderToTrade(o, currentDate));
  return [...baseTrades, ...customerTrades];
}
