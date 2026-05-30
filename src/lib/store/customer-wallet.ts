"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Ngwee } from "@/lib/ops/types";

const DEFAULT_BALANCE_NGWEE: Ngwee = 250_000_000;

type CustomerWalletState = {
  balanceNgwee: Ngwee;
};

type CustomerWalletActions = {
  fund: (amountNgwee: Ngwee) => void;
  withdraw: (amountNgwee: Ngwee) => boolean;
  reset: () => void;
};

export const useCustomerWalletStore = create<
  CustomerWalletState & CustomerWalletActions
>()(
  persist(
    (set, get) => ({
      balanceNgwee: DEFAULT_BALANCE_NGWEE,
      fund: (amountNgwee) =>
        set((state) => ({
          balanceNgwee: state.balanceNgwee + Math.max(0, amountNgwee),
        })),
      withdraw: (amountNgwee) => {
        if (amountNgwee <= 0 || get().balanceNgwee < amountNgwee) return false;
        set((state) => ({
          balanceNgwee: state.balanceNgwee - amountNgwee,
        }));
        return true;
      },
      reset: () => set({ balanceNgwee: DEFAULT_BALANCE_NGWEE }),
    }),
    { name: "ml-customer-wallet" }
  )
);
