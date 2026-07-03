"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Ngwee } from "@/lib/ops/types";
import { getAdapters } from "@/lib/adapters";
import type { PaymentChannel } from "@/lib/adapters/types";

/**
 * Ledger-sourced customer wallet (demo).
 *
 * The append-only entries are the source of truth. balanceNgwee is a cached
 * projection of them, never authoritative (golden rule 3). Deposits and
 * withdrawals go through the mock Payments adapter and carry an idempotency key
 * so a retry never moves money twice (golden rule 4). Withdrawals are restricted
 * to a verified payout method in the client's own name.
 *
 * In production these entries come from the ledger_entries table over RLS. The
 * shape here matches that table so the swap is a binding change, not a rewrite.
 */

const DEMO_ACCOUNT_ID = "demo-account";
const SEED_BALANCE_NGWEE: Ngwee = 250_000_000;

type WalletEntryType = "deposit" | "withdrawal";

type WalletEntry = {
  id: string;
  type: WalletEntryType;
  /** Signed ngwee: deposits positive, withdrawals negative. */
  amountNgwee: Ngwee;
  idempotencyKey: string;
  providerRef: string;
  at: string;
};

/** A payout method a client may withdraw to. Only verified ones are allowed. */
export type PayoutMethod = {
  channel: PaymentChannel;
  ref: string;
  verified: boolean;
};

const SEED_ENTRY: WalletEntry = {
  id: "seed",
  type: "deposit",
  amountNgwee: SEED_BALANCE_NGWEE,
  idempotencyKey: "seed",
  providerRef: "demo-seed",
  at: "2026-01-01T00:00:00.000Z",
};

/** Pure projection: sum the signed entries. Balance never drifts from here. */
export function projectBalanceNgwee(entries: WalletEntry[]): Ngwee {
  return entries.reduce((total, entry) => total + entry.amountNgwee, 0);
}

function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

type CustomerWalletState = {
  entries: WalletEntry[];
  /** Cached projection of entries. */
  balanceNgwee: Ngwee;
};

type CustomerWalletActions = {
  /** Deposit through the Payments adapter. Returns true once settled. */
  deposit: (amountNgwee: Ngwee, channel?: PaymentChannel) => Promise<boolean>;
  /** Withdraw to a verified own method through the Payments adapter. */
  withdraw: (amountNgwee: Ngwee, method: PayoutMethod) => Promise<boolean>;
  /** Backward-compatible fire-and-forget deposit used by the fund dialog. */
  fund: (amountNgwee: Ngwee) => void;
  reset: () => void;
};

function appendEntry(
  state: CustomerWalletState,
  entry: WalletEntry
): CustomerWalletState {
  // Idempotent: a repeated key never posts twice.
  if (state.entries.some((e) => e.idempotencyKey === entry.idempotencyKey)) {
    return state;
  }
  const entries = [...state.entries, entry];
  return { entries, balanceNgwee: projectBalanceNgwee(entries) };
}

export const useCustomerWalletStore = create<
  CustomerWalletState & CustomerWalletActions
>()(
  persist(
    (set, get) => ({
      entries: [SEED_ENTRY],
      balanceNgwee: SEED_BALANCE_NGWEE,

      deposit: async (amountNgwee, channel = "momo") => {
        if (amountNgwee <= 0) return false;
        const idempotencyKey = newIdempotencyKey();
        const result = await getAdapters().payments.deposit({
          accountId: DEMO_ACCOUNT_ID,
          channel,
          amountNgwee,
          methodRef: `${channel}-demo`,
          idempotencyKey,
        });
        if (result.status !== "settled") return false;
        set((state) =>
          appendEntry(state, {
            id: result.providerRef,
            type: "deposit",
            amountNgwee: result.amountNgwee,
            idempotencyKey,
            providerRef: result.providerRef,
            at: result.at,
          })
        );
        return true;
      },

      withdraw: async (amountNgwee, method) => {
        if (amountNgwee <= 0) return false;
        if (!method.verified) return false;
        if (get().balanceNgwee < amountNgwee) return false;
        const idempotencyKey = newIdempotencyKey();
        const result = await getAdapters().payments.withdraw({
          accountId: DEMO_ACCOUNT_ID,
          channel: method.channel,
          amountNgwee,
          methodRef: method.ref,
          idempotencyKey,
        });
        if (result.status !== "settled") return false;
        set((state) =>
          appendEntry(state, {
            id: result.providerRef,
            type: "withdrawal",
            amountNgwee: -result.amountNgwee,
            idempotencyKey,
            providerRef: result.providerRef,
            at: result.at,
          })
        );
        return true;
      },

      fund: (amountNgwee) => {
        void get().deposit(amountNgwee);
      },

      reset: () =>
        set({ entries: [SEED_ENTRY], balanceNgwee: SEED_BALANCE_NGWEE }),
    }),
    { name: "ml-customer-wallet-v2", version: 2 }
  )
);
