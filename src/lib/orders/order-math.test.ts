import { describe, it, expect } from "vitest";
import { computeTradeFees } from "@/lib/ops/trades";
import {
  resolveOrder,
  snapToLot,
  largestLotValue,
  type ResolveOrderParams,
} from "./order-math";

/** Base params for an equity buy, overridden per test. */
function equityBuy(overrides: Partial<ResolveOrderParams>): ResolveOrderParams {
  return {
    side: "BUY",
    assetClass: "EQUITY",
    mode: "quantity",
    priceType: "market",
    lastPriceNgwee: 390,
    boardLot: 100,
    ...overrides,
  };
}

describe("snapToLot", () => {
  it("snaps to the nearest whole board lot", () => {
    expect(snapToLot(240, 100)).toBe(200);
    expect(snapToLot(260, 100)).toBe(300);
  });

  it("returns a clean multiple when already on a lot", () => {
    expect(snapToLot(500, 100)).toBe(500);
  });

  it("returns 0 for zero, negative or invalid lots", () => {
    expect(snapToLot(0, 100)).toBe(0);
    expect(snapToLot(-50, 100)).toBe(0);
    expect(snapToLot(240, 0)).toBe(0);
  });
});

describe("largestLotValue", () => {
  it("rounds down to the largest whole lot that fits the budget", () => {
    // Budget 100000 ngwee at 680/share, lot 100 => one lot of 100 shares.
    expect(largestLotValue(100_000, 680, 100)).toBe(100);
  });

  it("returns 0 when the budget cannot afford a single lot", () => {
    expect(largestLotValue(50_000, 680, 100)).toBe(0);
  });

  it("guards zero and negative inputs", () => {
    expect(largestLotValue(0, 680, 100)).toBe(0);
    expect(largestLotValue(100_000, 0, 100)).toBe(0);
    expect(largestLotValue(100_000, 680, 0)).toBe(0);
  });
});

describe("resolveOrder quantity mode", () => {
  it("snaps quantity and includes fees in the buy all-in", () => {
    const result = resolveOrder(equityBuy({ quantity: 240 }));
    expect(result.resolvedQty).toBe(200);
    expect(result.grossNgwee).toBe(78_000);

    const fees = computeTradeFees(78_000, "EQUITY");
    expect(result.fees).toEqual(fees);
    expect(result.allInNgwee).toBe(78_000 + fees.totalNgwee);
    expect(result.remainderNgwee).toBe(0);
  });

  it("labels a market order as an estimate", () => {
    const result = resolveOrder(equityBuy({ quantity: 200 }));
    expect(result.isEstimate).toBe(true);
  });
});

describe("resolveOrder value mode", () => {
  it("rounds down and leaves the correct remainder in the wallet", () => {
    const result = resolveOrder(
      equityBuy({ mode: "value", valueNgwee: 100_000, lastPriceNgwee: 680 })
    );
    expect(result.resolvedQty).toBe(100);
    expect(result.grossNgwee).toBe(68_000);
    // 100000 budget minus 68000 gross leaves 32000 in the wallet.
    expect(result.remainderNgwee).toBe(32_000);
  });

  it("returns the whole budget as remainder when no lot fits", () => {
    const result = resolveOrder(
      equityBuy({ mode: "value", valueNgwee: 50_000, lastPriceNgwee: 680 })
    );
    expect(result.resolvedQty).toBe(0);
    expect(result.remainderNgwee).toBe(50_000);
  });
});

describe("resolveOrder sell proceeds", () => {
  it("nets fees off the gross for a sell", () => {
    const result = resolveOrder(
      equityBuy({ side: "SELL", quantity: 200, lastPriceNgwee: 5_200 })
    );
    expect(result.grossNgwee).toBe(1_040_000);
    const fees = computeTradeFees(1_040_000, "EQUITY");
    expect(result.allInNgwee).toBe(1_040_000 - fees.totalNgwee);
  });
});

describe("resolveOrder limit vs market", () => {
  it("prices a limit at the exact limit price and is not an estimate", () => {
    const result = resolveOrder(
      equityBuy({
        priceType: "limit",
        limitPriceNgwee: 400,
        lastPriceNgwee: 390,
        quantity: 100,
      })
    );
    expect(result.grossNgwee).toBe(40_000);
    expect(result.isEstimate).toBe(false);
  });

  it("falls back to last price when a limit price is omitted", () => {
    const result = resolveOrder(
      equityBuy({ priceType: "limit", quantity: 100 })
    );
    expect(result.grossNgwee).toBe(39_000);
  });
});

describe("resolveOrder asset classes", () => {
  it("uses government-security fees for a T-bill", () => {
    const result = resolveOrder({
      side: "BUY",
      assetClass: "TBILL",
      mode: "quantity",
      priceType: "limit",
      lastPriceNgwee: 9_750,
      limitPriceNgwee: 9_750,
      quantity: 100,
      boardLot: 100,
    });
    const fees = computeTradeFees(975_000, "TBILL");
    expect(result.fees).toEqual(fees);
    expect(result.fees.levyNgwee).toBe(0);
    expect(result.fees.csdNgwee).toBe(0);
  });
});

describe("resolveOrder graceful degradation", () => {
  it("returns a zero result when last price is non-positive", () => {
    const result = resolveOrder(equityBuy({ quantity: 200, lastPriceNgwee: 0 }));
    expect(result.resolvedQty).toBe(0);
    expect(result.grossNgwee).toBe(0);
    expect(result.fees.totalNgwee).toBe(0);
    expect(result.allInNgwee).toBe(0);
  });

  it("returns a zero result for empty quantity", () => {
    const result = resolveOrder(equityBuy({ quantity: 0 }));
    expect(result.resolvedQty).toBe(0);
    expect(result.fees.totalNgwee).toBe(0);
  });

  it("does not charge the flat CSD fee on a zero order", () => {
    const result = resolveOrder(equityBuy({ quantity: 0 }));
    expect(result.fees.csdNgwee).toBe(0);
  });
});
