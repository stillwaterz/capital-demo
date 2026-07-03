/**
 * Mock MarketData binding.
 *
 * Reads the seeded LuSE instruments already used across the demo. In production
 * this same port is filled by the LuSE market data feed.
 */

import { getInstrument, INSTRUMENTS } from "@/lib/mock/instruments";
import type { Ngwee } from "@/lib/ops/types";
import type { MarketDataAdapter, Quote } from "../types";

function quoteFor(symbol: string, lastPriceNgwee: Ngwee, changePercent: number): Quote {
  return {
    symbol,
    lastPriceNgwee,
    changePercent,
    asOf: new Date().toISOString(),
  };
}

export const mockMarketDataAdapter: MarketDataAdapter = {
  async getQuote(symbol) {
    const instrument = getInstrument(symbol);
    if (!instrument) return null;
    return quoteFor(symbol, instrument.lastPriceNgwee, instrument.changePercent);
  },

  async listQuotes() {
    return INSTRUMENTS.map((i) =>
      quoteFor(i.symbol, i.lastPriceNgwee, i.changePercent)
    );
  },

  async getPriceHistory(symbol, days) {
    const instrument = getInstrument(symbol);
    if (!instrument) return [];
    return instrument.prices30d.slice(-days);
  },
};
