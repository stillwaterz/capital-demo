import { describe, expect, it } from "vitest";

import type { LedgerEntryRow, LedgerEntryType } from "@/lib/db/types";
import {
  LARGE_VALUE_THRESHOLD_NGWEE,
  REASON_FUNNEL_PATTERN,
  REASON_HIGH_VELOCITY,
  REASON_LARGE_SINGLE_TXN,
  REASON_STRUCTURING,
  REASON_SUB_THRESHOLD_CLUSTER,
  REASON_THRESHOLD_BREACH,
  STRUCTURING_BAND_FLOOR_NGWEE,
  STRUCTURING_MIN_COUNT,
  THRESHOLD_CRITICAL_MULTIPLE,
  VELOCITY_MAX_COUNT,
  detectStructuring,
  detectThreshold,
  detectVelocity,
  runSurveillance,
} from "./surveillance";

const TENANT_ID = "tenant-capital";
const ACCOUNT_A = "acct-aaaa";
const ACCOUNT_B = "acct-bbbb";
const BASE_TIME_MS = Date.parse("2026-06-01T08:00:00.000Z");
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SMALL_AMOUNT_NGWEE = 500_000; // ZMW 5,000, below every band

let counter = 0;

function entry(
  overrides: Partial<LedgerEntryRow> & {
    account_id: string;
    amount_ngwee: number;
    created_at: string;
  }
): LedgerEntryRow {
  counter += 1;
  const type: LedgerEntryType = overrides.type ?? "deposit";
  return {
    id: `led-${counter}`,
    tenant_id: TENANT_ID,
    idempotency_key: `idem-${counter}`,
    related_ref: null,
    ...overrides,
    type,
  };
}

function iso(offsetMs: number): string {
  return new Date(BASE_TIME_MS + offsetMs).toISOString();
}

describe("detectThreshold", () => {
  it("raises a HIGH THRESHOLD alert for a single large transaction", () => {
    const findings = detectThreshold([
      entry({
        account_id: ACCOUNT_A,
        amount_ngwee: LARGE_VALUE_THRESHOLD_NGWEE,
        created_at: iso(0),
      }),
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe("THRESHOLD");
    expect(findings[0].severity).toBe("HIGH");
    expect(findings[0].reasonCodes).toEqual([
      REASON_LARGE_SINGLE_TXN,
      REASON_THRESHOLD_BREACH,
    ]);
    expect(findings[0].amountNgwee).toBe(LARGE_VALUE_THRESHOLD_NGWEE);
  });

  it("escalates to CRITICAL at the critical multiple", () => {
    const findings = detectThreshold([
      entry({
        account_id: ACCOUNT_A,
        amount_ngwee: LARGE_VALUE_THRESHOLD_NGWEE * THRESHOLD_CRITICAL_MULTIPLE,
        created_at: iso(0),
      }),
    ]);

    expect(findings[0].severity).toBe("CRITICAL");
  });

  it("ignores transactions below the threshold", () => {
    const findings = detectThreshold([
      entry({
        account_id: ACCOUNT_A,
        amount_ngwee: LARGE_VALUE_THRESHOLD_NGWEE - 1,
        created_at: iso(0),
      }),
    ]);

    expect(findings).toHaveLength(0);
  });
});

describe("detectVelocity", () => {
  it("raises a VELOCITY alert when rapid repeats exceed the window count", () => {
    const entries = Array.from({ length: VELOCITY_MAX_COUNT + 1 }, (_, i) =>
      entry({
        account_id: ACCOUNT_A,
        amount_ngwee: SMALL_AMOUNT_NGWEE,
        created_at: iso(i * FIVE_MINUTES_MS),
      })
    );

    const findings = detectVelocity(entries);

    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe("VELOCITY");
    expect(findings[0].severity).toBe("MEDIUM");
    expect(findings[0].reasonCodes).toEqual([
      REASON_HIGH_VELOCITY,
      REASON_FUNNEL_PATTERN,
    ]);
    expect(findings[0].amountNgwee).toBe(
      SMALL_AMOUNT_NGWEE * (VELOCITY_MAX_COUNT + 1)
    );
  });

  it("stays silent when transactions are spread beyond the window", () => {
    const entries = Array.from({ length: VELOCITY_MAX_COUNT + 1 }, (_, i) =>
      entry({
        account_id: ACCOUNT_A,
        amount_ngwee: SMALL_AMOUNT_NGWEE,
        created_at: iso(i * ONE_DAY_MS),
      })
    );

    expect(detectVelocity(entries)).toHaveLength(0);
  });
});

describe("detectStructuring", () => {
  it("raises a STRUCTURING alert for several just-under amounts", () => {
    const justUnder = LARGE_VALUE_THRESHOLD_NGWEE - 1_000_000; // ZMW 140,000
    const entries = Array.from({ length: STRUCTURING_MIN_COUNT }, (_, i) =>
      entry({
        account_id: ACCOUNT_A,
        amount_ngwee: justUnder,
        created_at: iso(i * ONE_DAY_MS),
      })
    );

    const findings = detectStructuring(entries);

    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe("STRUCTURING");
    expect(findings[0].severity).toBe("HIGH");
    expect(findings[0].reasonCodes).toEqual([
      REASON_STRUCTURING,
      REASON_SUB_THRESHOLD_CLUSTER,
    ]);
    expect(findings[0].amountNgwee).toBe(justUnder * STRUCTURING_MIN_COUNT);
  });

  it("ignores band transactions that never sum past the threshold", () => {
    const entries = [
      entry({
        account_id: ACCOUNT_A,
        amount_ngwee: STRUCTURING_BAND_FLOOR_NGWEE,
        created_at: iso(0),
      }),
      entry({
        account_id: ACCOUNT_A,
        amount_ngwee: STRUCTURING_BAND_FLOOR_NGWEE,
        created_at: iso(30 * ONE_DAY_MS),
      }),
    ];

    expect(detectStructuring(entries)).toHaveLength(0);
  });
});

describe("runSurveillance", () => {
  it("returns nothing for clean, spaced-out activity", () => {
    const entries = [
      entry({
        account_id: ACCOUNT_A,
        amount_ngwee: SMALL_AMOUNT_NGWEE,
        created_at: iso(0),
      }),
      entry({
        account_id: ACCOUNT_A,
        amount_ngwee: SMALL_AMOUNT_NGWEE,
        created_at: iso(10 * ONE_DAY_MS),
      }),
    ];

    expect(runSurveillance(entries)).toEqual([]);
  });

  it("opens every alert and carries reason codes and amount", () => {
    const alerts = runSurveillance([
      entry({
        account_id: ACCOUNT_A,
        amount_ngwee: LARGE_VALUE_THRESHOLD_NGWEE,
        created_at: iso(0),
      }),
    ]);

    expect(alerts).toHaveLength(1);
    expect(alerts[0].status).toBe("OPEN");
    expect(alerts[0].account_id).toBe(ACCOUNT_A);
    expect(alerts[0].reason_codes.length).toBeGreaterThan(0);
    expect(alerts[0].amount_ngwee).toBe(LARGE_VALUE_THRESHOLD_NGWEE);
    expect(alerts[0].description).toContain("threshold");
  });

  it("groups findings per account", () => {
    const alerts = runSurveillance([
      entry({
        account_id: ACCOUNT_A,
        amount_ngwee: LARGE_VALUE_THRESHOLD_NGWEE,
        created_at: iso(0),
      }),
      entry({
        account_id: ACCOUNT_B,
        amount_ngwee: LARGE_VALUE_THRESHOLD_NGWEE * THRESHOLD_CRITICAL_MULTIPLE,
        created_at: iso(0),
      }),
      entry({
        account_id: ACCOUNT_B,
        amount_ngwee: SMALL_AMOUNT_NGWEE,
        created_at: iso(FIVE_MINUTES_MS),
      }),
    ]);

    const forA = alerts.filter((a) => a.account_id === ACCOUNT_A);
    const forB = alerts.filter((a) => a.account_id === ACCOUNT_B);

    expect(forA).toHaveLength(1);
    expect(forA[0].severity).toBe("HIGH");
    expect(forB).toHaveLength(1);
    expect(forB[0].severity).toBe("CRITICAL");
  });

  it("can raise multiple alert types for one account", () => {
    const structuring = Array.from({ length: STRUCTURING_MIN_COUNT }, (_, i) =>
      entry({
        account_id: ACCOUNT_A,
        amount_ngwee: LARGE_VALUE_THRESHOLD_NGWEE - 1_000_000,
        created_at: iso(i * ONE_DAY_MS),
      })
    );
    const large = entry({
      account_id: ACCOUNT_A,
      amount_ngwee: LARGE_VALUE_THRESHOLD_NGWEE,
      created_at: iso(0),
    });

    const types = runSurveillance([large, ...structuring]).map((a) => a.type);

    expect(types).toContain("THRESHOLD");
    expect(types).toContain("STRUCTURING");
  });
});
