"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Ngwee } from "@/lib/ops/types";

export type Cadence = "weekly" | "monthly";

export type AutoInvestPlan = {
  id: string;
  symbol: string;
  amountNgwee: Ngwee;
  cadence: Cadence;
  active: boolean;
};

/** Average number of weeks in a month, used to level weekly plans to a month. */
const WEEKS_PER_MONTH = 4.33;

/**
 * Pure helper. The whole-ngwee amount a plan puts to work in a month.
 * Weekly plans are scaled by the weeks in a month and rounded.
 */
export function monthlyEquivalentNgwee(plan: AutoInvestPlan): Ngwee {
  if (plan.cadence === "monthly") return plan.amountNgwee;
  return Math.round(plan.amountNgwee * WEEKS_PER_MONTH);
}

type AutoInvestState = {
  plans: AutoInvestPlan[];
};

type AutoInvestActions = {
  add: (plan: Omit<AutoInvestPlan, "id" | "active">) => AutoInvestPlan;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
};

let planSeq = 1;

export const useAutoInvestStore = create<AutoInvestState & AutoInvestActions>()(
  persist(
    (set, get) => ({
      plans: [],
      add: (input) => {
        const plan: AutoInvestPlan = {
          ...input,
          id: `PLAN-${String(planSeq++).padStart(4, "0")}`,
          active: true,
        };
        set({ plans: [...get().plans, plan] });
        return plan;
      },
      remove: (id) => set({ plans: get().plans.filter((p) => p.id !== id) }),
      toggle: (id) =>
        set({
          plans: get().plans.map((p) =>
            p.id === id ? { ...p, active: !p.active } : p
          ),
        }),
      clear: () => set({ plans: [] }),
    }),
    { name: "ml-auto-invest" }
  )
);
