export type FxRate = {
  rate: number;
  asOf: string;
};

export async function fetchUsdZmw(): Promise<FxRate | null> {
  try {
    const res = await fetch(
      "https://api.frankfurter.dev/v1/latest?from=USD&to=ZMW",
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { rates?: { ZMW?: number }; date?: string };
    const rate = data.rates?.ZMW;
    if (!rate) return null;
    return { rate, asOf: data.date ?? new Date().toISOString().slice(0, 10) };
  } catch {
    return null;
  }
}
