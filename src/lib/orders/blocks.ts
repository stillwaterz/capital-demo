/**
 * Order block netting and average-price allocation.
 *
 * LuSE trades in a short daily window, so the Order agent nets same-counter
 * retail orders into blocks (BUILD_SPEC section 7). The operator releases blocks,
 * not hundreds of tickets, and each client is allocated back at the block average
 * fill price. Pure functions over a list of orders. Money is integer ngwee.
 */

import type { Ngwee, Side } from "@/lib/ops/types";

/** The minimal order shape the netting needs. */
export type BlockableOrder = {
  id: string;
  symbol: string;
  side: Side;
  quantity: number;
  priceNgwee: Ngwee;
  clientName: string;
};

/** One client's share of a block, filled at the block average price. */
export type BlockAllocation = {
  orderId: string;
  clientName: string;
  quantity: number;
  /** quantity * block average fill price, in ngwee. */
  considerationNgwee: Ngwee;
};

export type OrderBlock = {
  /** Stable id derived from symbol and side, for example "ATEL-BUY". */
  id: string;
  symbol: string;
  side: Side;
  aggregateQty: number;
  /** Quantity-weighted average price across the netted orders, in ngwee. */
  avgFillPriceNgwee: Ngwee;
  allocations: BlockAllocation[];
};

function blockKey(symbol: string, side: Side): string {
  return `${symbol}-${side}`;
}

/** Quantity-weighted average price, rounded to whole ngwee. */
function weightedAveragePrice(orders: BlockableOrder[]): Ngwee {
  const totalQty = orders.reduce((sum, o) => sum + o.quantity, 0);
  if (totalQty === 0) return 0;
  const totalValue = orders.reduce((sum, o) => sum + o.quantity * o.priceNgwee, 0);
  return Math.round(totalValue / totalQty);
}

/**
 * Net orders into blocks by symbol and side, allocating each client back at the
 * block average fill price. Off-session orders queue the same way.
 */
export function netIntoBlocks(orders: BlockableOrder[]): OrderBlock[] {
  const grouped = new Map<string, BlockableOrder[]>();
  for (const order of orders) {
    if (order.quantity <= 0) continue;
    const key = blockKey(order.symbol, order.side);
    const bucket = grouped.get(key);
    if (bucket) bucket.push(order);
    else grouped.set(key, [order]);
  }

  const blocks: OrderBlock[] = [];
  for (const [key, bucket] of grouped.entries()) {
    const avgFillPriceNgwee = weightedAveragePrice(bucket);
    const allocations: BlockAllocation[] = bucket.map((o) => ({
      orderId: o.id,
      clientName: o.clientName,
      quantity: o.quantity,
      considerationNgwee: o.quantity * avgFillPriceNgwee,
    }));
    blocks.push({
      id: key,
      symbol: bucket[0].symbol,
      side: bucket[0].side,
      aggregateQty: bucket.reduce((sum, o) => sum + o.quantity, 0),
      avgFillPriceNgwee,
      allocations,
    });
  }
  return blocks.sort((a, b) => a.id.localeCompare(b.id));
}

/** Total consideration across a block, in ngwee. */
export function blockConsiderationNgwee(block: OrderBlock): Ngwee {
  return block.aggregateQty * block.avgFillPriceNgwee;
}
