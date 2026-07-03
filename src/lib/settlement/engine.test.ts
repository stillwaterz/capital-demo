import { describe, expect, it } from "vitest";

import { SETTLEMENT_CYCLE_DAYS } from "@/lib/config/trading";
import type { SettlementLegStatusRow, SettlementRow } from "@/lib/db/types";
import type { IsoDate } from "@/lib/ops/types";
import {
  buildSettlementRecord,
  computeSettlementDate,
  deriveSettlementStatus,
  isBreak,
  listBreaks,
  plainClientTracker,
} from "./engine";

// 2026-06-01 is a Monday, so business-day arithmetic is easy to reason about.
const MONDAY: IsoDate = "2026-06-01";
const THURSDAY: IsoDate = "2026-06-04";
const FRIDAY: IsoDate = "2026-06-05";

function makeRecord(overrides: Partial<SettlementRow> = {}): SettlementRow {
  return {
    id: "settlement-1",
    tenant_id: "capital-demo",
    account_id: "account-1",
    execution_id: "execution-1",
    cycle_days: SETTLEMENT_CYCLE_DAYS,
    trade_date: MONDAY,
    settlement_date: THURSDAY,
    cash_leg_status: "pending",
    stock_leg_status: "pending",
    status: "pending",
    created_at: "2026-06-01T09:00:00.000Z",
    updated_at: "2026-06-01T09:00:00.000Z",
    ...overrides,
  };
}

describe("computeSettlementDate", () => {
  it("lands three business days after a Monday trade", () => {
    // Tue, Wed, Thu -> 2026-06-04.
    expect(computeSettlementDate(MONDAY)).toBe("2026-06-04");
  });

  it("skips the weekend from a Thursday trade", () => {
    // Fri, Mon, Tue -> 2026-06-09, skipping Sat and Sun.
    expect(computeSettlementDate(THURSDAY)).toBe("2026-06-09");
  });

  it("skips the weekend from a Friday trade", () => {
    // Mon, Tue, Wed -> 2026-06-10, skipping Sat and Sun.
    expect(computeSettlementDate(FRIDAY)).toBe("2026-06-10");
  });

  it("defaults to the configured T+n cycle", () => {
    expect(computeSettlementDate(MONDAY)).toBe(
      computeSettlementDate(MONDAY, SETTLEMENT_CYCLE_DAYS)
    );
  });

  it("honours a one-line move to T+1", () => {
    expect(computeSettlementDate(MONDAY, 1)).toBe("2026-06-02");
  });
});

describe("deriveSettlementStatus", () => {
  const cases: ReadonlyArray<
    [SettlementLegStatusRow, SettlementLegStatusRow, SettlementRow["status"]]
  > = [
    ["pending", "pending", "pending"],
    ["pending", "settled", "partial"],
    ["settled", "pending", "partial"],
    ["settled", "settled", "settled"],
    ["pending", "failed", "failed"],
    ["failed", "pending", "failed"],
    ["settled", "failed", "failed"],
    ["failed", "settled", "failed"],
    ["failed", "failed", "failed"],
  ];

  it.each(cases)(
    "cash %s and stock %s gives %s",
    (cashLeg, stockLeg, expected) => {
      expect(deriveSettlementStatus(cashLeg, stockLeg)).toBe(expected);
    }
  );
});

describe("isBreak", () => {
  const today: IsoDate = THURSDAY; // settlement_date THURSDAY is due today.

  it("flags a due record that is still pending", () => {
    expect(isBreak(makeRecord({ status: "pending" }), today)).toBe(true);
  });

  it("flags a due record that is partial", () => {
    expect(isBreak(makeRecord({ status: "partial" }), today)).toBe(true);
  });

  it("flags a due record that has failed", () => {
    expect(isBreak(makeRecord({ status: "failed" }), today)).toBe(true);
  });

  it("does not flag a due record that has fully settled", () => {
    expect(isBreak(makeRecord({ status: "settled" }), today)).toBe(false);
  });

  it("does not flag an unsettled record that is not yet due", () => {
    const notDue = makeRecord({ settlement_date: "2026-06-10", status: "pending" });
    expect(isBreak(notDue, today)).toBe(false);
  });
});

describe("listBreaks", () => {
  it("returns only the due and unsettled records", () => {
    const records: SettlementRow[] = [
      makeRecord({ id: "a", settlement_date: THURSDAY, status: "pending" }),
      makeRecord({ id: "b", settlement_date: THURSDAY, status: "settled" }),
      makeRecord({ id: "c", settlement_date: "2026-06-10", status: "pending" }),
      makeRecord({ id: "d", settlement_date: MONDAY, status: "failed" }),
    ];
    const breaks = listBreaks(records, THURSDAY);
    expect(breaks.map((record) => record.id)).toEqual(["a", "d"]);
  });
});

describe("plainClientTracker", () => {
  it("names the arrival day while settlement is pending", () => {
    expect(plainClientTracker(THURSDAY, MONDAY)).toBe(
      "Your shares arrive on 4 June 2026"
    );
  });

  it("confirms arrival once settlement is due", () => {
    expect(plainClientTracker(MONDAY, THURSDAY)).toBe("Your shares have arrived");
  });
});

describe("buildSettlementRecord", () => {
  const record = buildSettlementRecord({
    tenantId: "capital-demo",
    accountId: "account-9",
    executionId: "execution-9",
    tradeDate: MONDAY,
    cashAmountNgwee: 150_000,
  });

  it("copies the execution identity fields", () => {
    expect(record.tenant_id).toBe("capital-demo");
    expect(record.account_id).toBe("account-9");
    expect(record.execution_id).toBe("execution-9");
  });

  it("computes the settlement date on the default cycle", () => {
    expect(record.cycle_days).toBe(SETTLEMENT_CYCLE_DAYS);
    expect(record.trade_date).toBe(MONDAY);
    expect(record.settlement_date).toBe("2026-06-04");
  });

  it("opens both legs and the combined status as pending", () => {
    expect(record.cash_leg_status).toBe("pending");
    expect(record.stock_leg_status).toBe("pending");
    expect(record.status).toBe("pending");
  });

  it("honours a T+1 cycle override", () => {
    const t1 = buildSettlementRecord({
      tenantId: "capital-demo",
      accountId: "account-9",
      executionId: "execution-9",
      tradeDate: MONDAY,
      cashAmountNgwee: 150_000,
      cycleDays: 1,
    });
    expect(t1.cycle_days).toBe(1);
    expect(t1.settlement_date).toBe("2026-06-02");
  });
});
