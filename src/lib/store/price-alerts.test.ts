import { describe, it, expect } from "vitest";
import { evaluateAlerts, type PriceAlert } from "./price-alerts";

const ABOVE_ALERT: PriceAlert = {
  id: "ALERT-0001",
  symbol: "ATEL",
  direction: "above",
  targetNgwee: 3000,
};

const BELOW_ALERT: PriceAlert = {
  id: "ALERT-0002",
  symbol: "BATA",
  direction: "below",
  targetNgwee: 1800,
};

describe("evaluateAlerts", () => {
  it("returns no alerts when the list is empty", () => {
    expect(evaluateAlerts([], { ATEL: 3000 })).toEqual([]);
  });

  it("triggers an above alert when price is over the target", () => {
    const triggered = evaluateAlerts([ABOVE_ALERT], { ATEL: 3100 });
    expect(triggered).toEqual([ABOVE_ALERT]);
  });

  it("triggers an above alert when price equals the target", () => {
    const triggered = evaluateAlerts([ABOVE_ALERT], { ATEL: 3000 });
    expect(triggered).toEqual([ABOVE_ALERT]);
  });

  it("does not trigger an above alert when price is under the target", () => {
    expect(evaluateAlerts([ABOVE_ALERT], { ATEL: 2999 })).toEqual([]);
  });

  it("triggers a below alert when price is under the target", () => {
    const triggered = evaluateAlerts([BELOW_ALERT], { BATA: 1700 });
    expect(triggered).toEqual([BELOW_ALERT]);
  });

  it("triggers a below alert when price equals the target", () => {
    const triggered = evaluateAlerts([BELOW_ALERT], { BATA: 1800 });
    expect(triggered).toEqual([BELOW_ALERT]);
  });

  it("does not trigger a below alert when price is over the target", () => {
    expect(evaluateAlerts([BELOW_ALERT], { BATA: 1801 })).toEqual([]);
  });

  it("ignores alerts with no known price for their symbol", () => {
    expect(evaluateAlerts([ABOVE_ALERT], {})).toEqual([]);
  });

  it("returns only the triggered alerts from a mixed list", () => {
    const prices = { ATEL: 3100, BATA: 1900 };
    const triggered = evaluateAlerts([ABOVE_ALERT, BELOW_ALERT], prices);
    expect(triggered).toEqual([ABOVE_ALERT]);
  });

  it("does not mutate the input list", () => {
    const alerts = [ABOVE_ALERT, BELOW_ALERT];
    evaluateAlerts(alerts, { ATEL: 3100, BATA: 1700 });
    expect(alerts).toEqual([ABOVE_ALERT, BELOW_ALERT]);
  });
});
