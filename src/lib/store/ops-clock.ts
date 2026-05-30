"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IsoDate } from "@/lib/ops/types";
import { DEMO_TODAY, nextBusinessDay } from "@/lib/ops/clock";

type OpsClockState = {
  /** The current business date the whole ops console operates against. */
  businessDate: IsoDate;
};

type OpsClockActions = {
  /** Advance the business date to the next business day (drives T+1 settlement). */
  advanceDay: () => void;
  /** Set the business date directly. */
  setBusinessDate: (date: IsoDate) => void;
  /** Reset the clock back to the demo start date. */
  reset: () => void;
};

const DEFAULT_STATE: OpsClockState = {
  businessDate: DEMO_TODAY,
};

export const useOpsClockStore = create<OpsClockState & OpsClockActions>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      advanceDay: () =>
        set((state) => ({ businessDate: nextBusinessDay(state.businessDate) })),
      setBusinessDate: (businessDate) => set({ businessDate }),
      reset: () => set(DEFAULT_STATE),
    }),
    { name: "ml-ops-clock" }
  )
);
