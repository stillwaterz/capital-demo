/**
 * Mock Payments binding.
 *
 * Moves money instantly and settles it, the "mock deposit and withdraw" from
 * BUILD_SPEC. In production this port is filled by MoMo and bank rails.
 *
 * Idempotency is honoured: a retry with the same key returns the first result
 * rather than moving money twice. The store is in-memory, which is fine for a
 * single-process demo. The real binding keys off the same idempotency key.
 */

import type { PaymentRequest, PaymentResult, PaymentsAdapter } from "../types";

const settledByKey = new Map<string, PaymentResult>();

function settle(request: PaymentRequest, kind: "dep" | "wd"): PaymentResult {
  const existing = settledByKey.get(request.idempotencyKey);
  if (existing) return existing;

  const result: PaymentResult = {
    providerRef: `mock-${kind}-${request.idempotencyKey}`,
    status: "settled",
    amountNgwee: request.amountNgwee,
    at: new Date().toISOString(),
  };
  settledByKey.set(request.idempotencyKey, result);
  return result;
}

export const mockPaymentsAdapter: PaymentsAdapter = {
  async deposit(request) {
    return settle(request, "dep");
  },
  async withdraw(request) {
    return settle(request, "wd");
  },
};
