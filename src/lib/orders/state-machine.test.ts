import { describe, it, expect } from "vitest";
import {
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
  canTransition,
  nextStatuses,
  isCancellable,
  hasCashForBuy,
  hasHoldingsForSell,
  isWholeLot,
  isPriceWithinBand,
  runPreTradeChecks,
  DEFAULT_PRICE_BAND_BPS,
  type PreTradeCheckParams,
} from "./state-machine";

describe("order status transitions", () => {
  it("exposes every lifecycle status", () => {
    expect(ORDER_STATUSES).toContain("draft");
    expect(ORDER_STATUSES).toContain("partially_filled");
    expect(ORDER_STATUSES).toHaveLength(11);
  });

  it("allows valid forward transitions", () => {
    expect(canTransition("draft", "confirmed")).toBe(true);
    expect(canTransition("cooling_off", "queued")).toBe(true);
    expect(canTransition("working", "partially_filled")).toBe(true);
    expect(canTransition("working", "filled")).toBe(true);
    expect(canTransition("partially_filled", "filled")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransition("draft", "queued")).toBe(false);
    expect(canTransition("draft", "filled")).toBe(false);
    expect(canTransition("cooling_off", "working")).toBe(false);
  });

  it("treats terminal states as dead ends", () => {
    for (const terminal of ["filled", "cancelled", "rejected", "expired"] as const) {
      expect(nextStatuses(terminal)).toHaveLength(0);
    }
  });

  it("lets an order be rejected or expired from the queue lanes", () => {
    expect(canTransition("queued", "rejected")).toBe(true);
    expect(canTransition("queued", "expired")).toBe(true);
    expect(canTransition("staged", "rejected")).toBe(true);
  });

  it("keeps ORDER_TRANSITIONS keyed for every status", () => {
    for (const status of ORDER_STATUSES) {
      expect(ORDER_TRANSITIONS[status]).toBeDefined();
    }
  });
});

describe("isCancellable", () => {
  it("is cancellable from queued, staged and working", () => {
    expect(isCancellable("queued")).toBe(true);
    expect(isCancellable("staged")).toBe(true);
    expect(isCancellable("working")).toBe(true);
  });

  it("is not cancellable before validation or after a fill", () => {
    expect(isCancellable("draft")).toBe(false);
    expect(isCancellable("confirmed")).toBe(false);
    expect(isCancellable("filled")).toBe(false);
    expect(isCancellable("cancelled")).toBe(false);
  });
});

describe("hasCashForBuy", () => {
  it("passes when the wallet covers the all-in cost exactly", () => {
    expect(hasCashForBuy(79_436, 79_436)).toEqual({ ok: true });
  });

  it("fails with a reason code when short", () => {
    expect(hasCashForBuy(79_435, 79_436)).toEqual({
      ok: false,
      reasonCode: "INSUFFICIENT_CASH",
    });
  });
});

describe("hasHoldingsForSell", () => {
  it("passes when holdings cover the sell", () => {
    expect(hasHoldingsForSell(200, 200)).toEqual({ ok: true });
  });

  it("fails when it would go short", () => {
    expect(hasHoldingsForSell(100, 200)).toEqual({
      ok: false,
      reasonCode: "INSUFFICIENT_HOLDINGS",
    });
  });

  it("fails on a zero-quantity sell", () => {
    expect(hasHoldingsForSell(200, 0)).toEqual({
      ok: false,
      reasonCode: "INSUFFICIENT_HOLDINGS",
    });
  });
});

describe("isWholeLot", () => {
  it("passes on a whole multiple of the board lot", () => {
    expect(isWholeLot(200, 100)).toEqual({ ok: true });
  });

  it("fails on a partial lot", () => {
    expect(isWholeLot(250, 100)).toEqual({
      ok: false,
      reasonCode: "NOT_WHOLE_LOT",
    });
  });

  it("fails on a zero quantity", () => {
    expect(isWholeLot(0, 100)).toEqual({
      ok: false,
      reasonCode: "NOT_WHOLE_LOT",
    });
  });
});

describe("isPriceWithinBand", () => {
  it("passes inside the default band", () => {
    // 10% of 680 is 68 ngwee tolerance, 700 is 20 away.
    expect(isPriceWithinBand(700, 680)).toEqual({ ok: true });
  });

  it("fails outside the band", () => {
    expect(isPriceWithinBand(800, 680)).toEqual({
      ok: false,
      reasonCode: "PRICE_OUT_OF_BAND",
    });
  });

  it("respects a custom band", () => {
    expect(isPriceWithinBand(800, 680, 2_000).ok).toBe(true);
  });

  it("fails when last price is non-positive", () => {
    expect(isPriceWithinBand(680, 0)).toEqual({
      ok: false,
      reasonCode: "PRICE_OUT_OF_BAND",
    });
  });

  it("uses a sensible default band", () => {
    expect(DEFAULT_PRICE_BAND_BPS).toBeGreaterThan(0);
  });
});

/** A clean, passing buy check set, overridden per test. */
function buyChecks(overrides: Partial<PreTradeCheckParams>): PreTradeCheckParams {
  return {
    side: "BUY",
    walletNgwee: 100_000,
    allInNgwee: 69_316,
    heldQty: 0,
    qty: 100,
    boardLot: 100,
    priceNgwee: 680,
    lastPriceNgwee: 680,
    ...overrides,
  };
}

describe("runPreTradeChecks", () => {
  it("passes a clean buy with no failures", () => {
    const result = runPreTradeChecks(buyChecks({}));
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("aggregates every reason-coded buy failure", () => {
    const result = runPreTradeChecks(
      buyChecks({
        walletNgwee: 100,
        qty: 250,
        priceNgwee: 900,
      })
    );
    expect(result.ok).toBe(false);
    const codes = result.failures.map((f) => f.reasonCode);
    expect(codes).toContain("NOT_WHOLE_LOT");
    expect(codes).toContain("PRICE_OUT_OF_BAND");
    expect(codes).toContain("INSUFFICIENT_CASH");
  });

  it("carries a plain English message for each failure", () => {
    const result = runPreTradeChecks(buyChecks({ walletNgwee: 100 }));
    expect(result.failures[0].message.length).toBeGreaterThan(0);
  });

  it("checks holdings rather than cash for a sell", () => {
    const result = runPreTradeChecks(
      buyChecks({ side: "SELL", heldQty: 0, qty: 100 })
    );
    expect(result.ok).toBe(false);
    expect(result.failures.map((f) => f.reasonCode)).toContain(
      "INSUFFICIENT_HOLDINGS"
    );
  });

  it("passes a clean sell backed by holdings", () => {
    const result = runPreTradeChecks(
      buyChecks({ side: "SELL", heldQty: 500, qty: 100 })
    );
    expect(result.ok).toBe(true);
  });
});
