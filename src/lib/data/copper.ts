export type CopperPrice = {
  priceUsd: number;
  changePercent: number;
  asOf: string;
};

export async function fetchCopperPrice(): Promise<CopperPrice | null> {
  try {
    const yahooFinance = (await import("yahoo-finance2")).default;
    const raw = await yahooFinance.quote("HG=F");
    const quote = raw as { regularMarketPrice?: number; regularMarketChangePercent?: number };
    const price = quote.regularMarketPrice;
    const changePercent = quote.regularMarketChangePercent;
    if (!price) return null;
    return {
      priceUsd: price,
      changePercent: changePercent ?? 0,
      asOf: new Date().toISOString().slice(0, 10),
    };
  } catch {
    return null;
  }
}
