/**
 * Mock Execution binding.
 *
 * Auto-fills a staged order after a short delay, the demo binding from
 * BUILD_SPEC. Submit stages the order as working, then it fills once the delay
 * has passed. In production this port is the operator queue plus ATS
 * confirmation ingestion.
 *
 * Idempotency is honoured on submit: a retry with the same key returns the same
 * staged order rather than double-filling. State is in-memory, fine for the
 * single-process demo.
 */

import { getInstrument } from "@/lib/mock/instruments";
import type { Ngwee } from "@/lib/ops/types";
import type {
  ExecutionAdapter,
  ExecutionRequest,
  ExecutionResult,
} from "../types";

/** How long a mock order sits working before it auto-fills. */
const FILL_DELAY_MS = 3_000;

type StagedOrder = {
  request: ExecutionRequest;
  fillPriceNgwee: Ngwee;
  stagedAtMs: number;
  cancelled: boolean;
};

const stagedByOrderId = new Map<string, StagedOrder>();
const orderIdByKey = new Map<string, string>();

function fillPriceFor(request: ExecutionRequest): Ngwee {
  if (request.limitPriceNgwee !== null) return request.limitPriceNgwee;
  const instrument = getInstrument(request.symbol);
  return instrument ? instrument.lastPriceNgwee : 0;
}

function resultFor(order: StagedOrder, nowMs: number): ExecutionResult {
  const { request } = order;
  if (order.cancelled) {
    return {
      orderId: request.orderId,
      status: "cancelled",
      filledQty: 0,
      fillPriceNgwee: null,
      atsRef: null,
      at: new Date(nowMs).toISOString(),
    };
  }
  const filled = nowMs - order.stagedAtMs >= FILL_DELAY_MS;
  return {
    orderId: request.orderId,
    status: filled ? "filled" : "working",
    filledQty: filled ? request.quantity : 0,
    fillPriceNgwee: filled ? order.fillPriceNgwee : null,
    atsRef: filled ? `mock-ats-${request.orderId}` : null,
    at: new Date(nowMs).toISOString(),
  };
}

export const mockExecutionAdapter: ExecutionAdapter = {
  async submit(request) {
    const existingId = orderIdByKey.get(request.idempotencyKey);
    if (existingId) {
      const existing = stagedByOrderId.get(existingId);
      if (existing) return resultFor(existing, Date.now());
    }
    const order: StagedOrder = {
      request,
      fillPriceNgwee: fillPriceFor(request),
      stagedAtMs: Date.now(),
      cancelled: false,
    };
    stagedByOrderId.set(request.orderId, order);
    orderIdByKey.set(request.idempotencyKey, request.orderId);
    return resultFor(order, Date.now());
  },

  async getStatus(orderId) {
    const order = stagedByOrderId.get(orderId);
    return order ? resultFor(order, Date.now()) : null;
  },

  async cancel(orderId) {
    const order = stagedByOrderId.get(orderId);
    if (!order) {
      return {
        orderId,
        status: "rejected",
        filledQty: 0,
        fillPriceNgwee: null,
        atsRef: null,
        at: new Date().toISOString(),
      };
    }
    const nowMs = Date.now();
    // A real cancel only lands while unfilled. Once filled, it stays filled.
    if (nowMs - order.stagedAtMs < FILL_DELAY_MS) {
      order.cancelled = true;
    }
    return resultFor(order, nowMs);
  },
};
