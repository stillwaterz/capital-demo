/**
 * Contract note generation (BUILD_SPEC section 8).
 *
 * Turns executed customer orders into numbered, hash-chained contract notes.
 * This module owns the economics (consideration, commission, stamp duty and
 * settlement date) and then hands each note to the pure hash-chain engine so
 * the tamper-evident numbering and hashing live in one place only.
 *
 * Pure and deterministic. No clock, no network, no React. Money is integer
 * ngwee. Never reimplement hashing here, always chain through appendNote.
 */

import type { AssetClass } from "@/lib/ops/types";
import type { CustomerOrder } from "@/lib/store/customer-orders";
import { computeTradeFees, ngweeBps } from "@/lib/ops/trades";
import { addBusinessDays } from "@/lib/ops/clock";
import { SETTLEMENT_CYCLE_DAYS } from "@/lib/config/trading";
import {
  appendNote,
  type ContractNote,
  type ContractNotePayload,
} from "./hash-chain";

/**
 * Stamp duty on a LuSE securities transfer, in basis points of consideration.
 * Small statutory levy, charged on top of brokerage commission.
 */
export const STAMP_DUTY_BPS = 15; // 0.15%

/** Default asset class when an order does not carry one. */
const DEFAULT_ASSET_CLASS: AssetClass = "EQUITY";

/**
 * Build the economic payload for one order and chain it onto prevNote.
 * Pure: returns a fresh note and never mutates prevNote.
 */
export function buildContractNote(
  prevNote: ContractNote | null,
  order: CustomerOrder,
  assetClass: AssetClass = DEFAULT_ASSET_CLASS
): ContractNote {
  const considerationNgwee = order.quantity * order.priceNgwee;
  const fees = computeTradeFees(considerationNgwee, assetClass);
  const payload: ContractNotePayload = {
    symbol: order.symbol,
    quantity: order.quantity,
    priceNgwee: order.priceNgwee,
    considerationNgwee,
    commissionNgwee: fees.brokerageNgwee,
    stampDutyNgwee: ngweeBps(considerationNgwee, STAMP_DUTY_BPS),
    tradeDate: order.tradeDate,
    settlementDate: addBusinessDays(order.tradeDate, SETTLEMENT_CYCLE_DAYS),
  };
  return appendNote(prevNote, payload);
}

/** Sort orders by placement time so the chain is numbered in trade order. */
function byPlacedAt(a: CustomerOrder, b: CustomerOrder): number {
  return a.placedAt < b.placedAt ? -1 : a.placedAt > b.placedAt ? 1 : 0;
}

/**
 * Fold the whole order book into a numbered hash chain starting at 1.
 * Pure: the same orders always produce the same chain of notes.
 */
export function buildNotesForOrders(orders: CustomerOrder[]): ContractNote[] {
  const ordered = [...orders].sort(byPlacedAt);
  const notes: ContractNote[] = [];
  let prev: ContractNote | null = null;
  for (const order of ordered) {
    prev = buildContractNote(prev, order);
    notes.push(prev);
  }
  return notes;
}
