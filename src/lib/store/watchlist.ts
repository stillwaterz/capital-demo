"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WatchlistState = {
  symbols: string[];
};

type WatchlistActions = {
  add: (symbol: string) => void;
  remove: (symbol: string) => void;
  toggle: (symbol: string) => void;
  has: (symbol: string) => boolean;
  clear: () => void;
};

export const useWatchlistStore = create<WatchlistState & WatchlistActions>()(
  persist(
    (set, get) => ({
      symbols: [],
      add: (symbol) => {
        if (get().symbols.includes(symbol)) return;
        set({ symbols: [...get().symbols, symbol] });
      },
      remove: (symbol) =>
        set({ symbols: get().symbols.filter((s) => s !== symbol) }),
      toggle: (symbol) => {
        if (get().symbols.includes(symbol)) {
          get().remove(symbol);
          return;
        }
        get().add(symbol);
      },
      has: (symbol) => get().symbols.includes(symbol),
      clear: () => set({ symbols: [] }),
    }),
    { name: "ml-watchlist" }
  )
);
