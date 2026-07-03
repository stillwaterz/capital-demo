import { describe, it, expect } from "vitest";
import type { CustomerOrder } from "@/lib/store/customer-orders";
import {
  EQUITY_BROKERAGE_BPS,
  ngweeBps,
} from "@/lib/ops/trades";
import { addBusinessDays } from "@/lib/ops/clock";
import { SETTLEMENT_CYCLE_DAYS } from "@/lib/config/trading";
import { verifyChain } from "./hash-chain";
import {
  STAMP_DUTY_BPS,
  buildContractNote,
  buildNotesForOrders,
} from "./generate";

/** Build a customer order with defaults so tests state only what matters. */
function makeOrder(overrides: Partial<CustomerOrder> = {}): CustomerOrder {
  return {
    id: "CUST-0001",
    symbol: "ZANACO",
    name: "Zambia National Commercial Bank",
    side: "BUY",
    quantity: 1_000,
    priceNgwee: 250,
    tradeDate: "2026-07-01",
    clientName: "Chanda M.",
    placedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

describe("buildContractNote", () => {
  it("computes consideration, commission, stamp duty and settlement date", () => {
    const note = buildContractNote(null, makeOrder());
    const consideration = 1_000 * 250;
    expect(note.payload.considerationNgwee).toBe(consideration);
    expect(note.payload.commissionNgwee).toBe(
      ngweeBps(consideration, EQUITY_BROKERAGE_BPS)
    );
    expect(note.payload.stampDutyNgwee).toBe(
      ngweeBps(consideration, STAMP_DUTY_BPS)
    );
    expect(note.payload.settlementDate).toBe(
      addBusinessDays("2026-07-01", SETTLEMENT_CYCLE_DAYS)
    );
  });
});

describe("buildNotesForOrders", () => {
  it("numbers the chain from 1 and increments by 1", () => {
    const orders = [
      makeOrder({ id: "CUST-0001", placedAt: "2026-07-01T08:00:00.000Z" }),
      makeOrder({ id: "CUST-0002", placedAt: "2026-07-01T09:00:00.000Z" }),
      makeOrder({ id: "CUST-0003", placedAt: "2026-07-01T10:00:00.000Z" }),
    ];
    const notes = buildNotesForOrders(orders);
    expect(notes.map((n) => n.sequential_number)).toEqual([1, 2, 3]);
  });

  it("orders notes by placement time regardless of input order", () => {
    const orders = [
      makeOrder({ id: "LATE", placedAt: "2026-07-01T12:00:00.000Z" }),
      makeOrder({ id: "EARLY", placedAt: "2026-07-01T08:00:00.000Z" }),
    ];
    const notes = buildNotesForOrders(orders);
    expect(notes[0].sequential_number).toBe(1);
    expect(notes[1].sequential_number).toBe(2);
  });

  it("produces a chain that verifies", () => {
    const orders = [
      makeOrder({ id: "CUST-0001", placedAt: "2026-07-01T08:00:00.000Z" }),
      makeOrder({
        id: "CUST-0002",
        symbol: "CEC",
        quantity: 500,
        priceNgwee: 14_500,
        placedAt: "2026-07-01T09:00:00.000Z",
      }),
    ];
    const notes = buildNotesForOrders(orders);
    expect(verifyChain(notes).ok).toBe(true);
    expect(notes[0].prev_hash).toBeNull();
    expect(notes[1].prev_hash).toBe(notes[0].hash);
  });

  it("returns an empty chain for no orders", () => {
    expect(buildNotesForOrders([])).toEqual([]);
  });
});
