"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEMO_TBILL_HOLDINGS, type TBillHolding } from "@/lib/mock/tbills";

type TBillsState = {
  holdings: TBillHolding[];
};

type TBillsActions = {
  setAutoRoll: (holdingId: string, enabled: boolean) => void;
  resetHoldings: () => void;
};

export const useTBillsStore = create<TBillsState & TBillsActions>()(
  persist(
    (set) => ({
      holdings: DEMO_TBILL_HOLDINGS,
      setAutoRoll: (holdingId, enabled) =>
        set((state) => ({
          holdings: state.holdings.map((h) =>
            h.id === holdingId ? { ...h, autoRoll: enabled } : h
          ),
        })),
      resetHoldings: () => set({ holdings: DEMO_TBILL_HOLDINGS }),
    }),
    { name: "ml-tbills" }
  )
);
