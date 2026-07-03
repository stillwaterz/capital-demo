"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Ngwee } from "@/lib/ops/types";

export type AlertDirection = "above" | "below";

export type PriceAlert = {
  id: string;
  symbol: string;
  direction: AlertDirection;
  targetNgwee: Ngwee;
};

/**
 * Pure check for which alerts have triggered.
 *
 * An "above" alert triggers when the current price is at or above its target.
 * A "below" alert triggers when the current price is at or below its target.
 * Alerts with no known price for their symbol are treated as not triggered.
 */
export function evaluateAlerts(
  alerts: PriceAlert[],
  priceBySymbol: Record<string, number>
): PriceAlert[] {
  return alerts.filter((alert) => {
    const price = priceBySymbol[alert.symbol];
    if (price === undefined) return false;
    if (alert.direction === "above") return price >= alert.targetNgwee;
    return price <= alert.targetNgwee;
  });
}

type PriceAlertsState = {
  alerts: PriceAlert[];
};

type PriceAlertsActions = {
  add: (alert: Omit<PriceAlert, "id">) => PriceAlert;
  remove: (id: string) => void;
  clear: () => void;
};

let alertSeq = 1;

export const usePriceAlertsStore = create<
  PriceAlertsState & PriceAlertsActions
>()(
  persist(
    (set, get) => ({
      alerts: [],
      add: (input) => {
        const alert: PriceAlert = {
          ...input,
          id: `ALERT-${String(alertSeq++).padStart(4, "0")}`,
        };
        set({ alerts: [...get().alerts, alert] });
        return alert;
      },
      remove: (id) => set({ alerts: get().alerts.filter((a) => a.id !== id) }),
      clear: () => set({ alerts: [] }),
    }),
    { name: "ml-price-alerts" }
  )
);
