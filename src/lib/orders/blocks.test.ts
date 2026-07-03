import { describe, it, expect } from "vitest";
import {
  netIntoBlocks,
  blockConsiderationNgwee,
  type BlockableOrder,
} from "./blocks";

function order(over: Partial<BlockableOrder>): BlockableOrder {
  return {
    id: "O1",
    symbol: "ATEL",
    side: "BUY",
    quantity: 100,
    priceNgwee: 2850,
    clientName: "Chanda M.",
    ...over,
  };
}

describe("netIntoBlocks", () => {
  it("nets same symbol and side into one block", () => {
    const blocks = netIntoBlocks([
      order({ id: "A", quantity: 100, clientName: "Chanda" }),
      order({ id: "B", quantity: 300, clientName: "Mutale" }),
    ]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].aggregateQty).toBe(400);
    expect(blocks[0].allocations).toHaveLength(2);
  });

  it("keeps buys and sells in separate blocks", () => {
    const blocks = netIntoBlocks([
      order({ id: "A", side: "BUY" }),
      order({ id: "B", side: "SELL" }),
    ]);
    expect(blocks).toHaveLength(2);
    expect(blocks.map((b) => b.id).sort()).toEqual(["ATEL-BUY", "ATEL-SELL"]);
  });

  it("allocates every client at the quantity-weighted average price", () => {
    const blocks = netIntoBlocks([
      order({ id: "A", quantity: 100, priceNgwee: 1000, clientName: "One" }),
      order({ id: "B", quantity: 300, priceNgwee: 2000, clientName: "Two" }),
    ]);
    // (100*1000 + 300*2000) / 400 = 1750
    expect(blocks[0].avgFillPriceNgwee).toBe(1750);
    for (const alloc of blocks[0].allocations) {
      expect(alloc.considerationNgwee).toBe(alloc.quantity * 1750);
    }
  });

  it("ignores zero or negative quantity orders", () => {
    const blocks = netIntoBlocks([order({ id: "A", quantity: 0 })]);
    expect(blocks).toHaveLength(0);
  });

  it("sums block consideration from aggregate quantity and average price", () => {
    const [block] = netIntoBlocks([
      order({ id: "A", quantity: 200, priceNgwee: 500 }),
    ]);
    expect(blockConsiderationNgwee(block)).toBe(200 * 500);
  });
});
