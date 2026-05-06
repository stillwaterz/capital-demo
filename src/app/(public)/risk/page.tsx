import type { Metadata } from "next";

export const metadata: Metadata = { title: "Risk Disclosure - MarketLink" };

export default function RiskPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <section>
        <h1 className="text-4xl font-bold font-display tracking-tight">Risk Disclosure</h1>
        <p className="text-sm text-muted-foreground mt-2">Read this before you invest. May 2026.</p>
      </section>

      <div className="border border-red-200 bg-red-50 rounded-2xl px-5 py-4">
        <p className="text-sm font-semibold text-red-700 mb-1">Important</p>
        <p className="text-sm text-red-700 leading-relaxed">
          Investing involves risk. You could lose some or all of the money you invest. Past returns do not predict future results. Do not invest money you cannot afford to lose.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Equity risk</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          LuSE equities can go up and down in price. A company's share price can fall due to poor financial results, changes in management, sector conditions, regulatory changes or broader economic events. In the worst case a company can fail and shares become worthless. You should diversify and not put all your money into one counter.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">T-Bill and government security risk</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          GRZ Treasury Bills are issued by the Zambian government and are generally considered lower risk than equities. However, T-bill yields vary by auction - the rate you see today may differ from the rate at the next auction. Holding to maturity guarantees the face value, but early exit may result in a lower return. In rare circumstances, a sovereign could fail to meet obligations.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Currency risk</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          All returns are in Zambian Kwacha (ZMW). If you invested in foreign currency and converted to ZMW, or if you plan to convert returns back to foreign currency, movements in the exchange rate can increase or reduce your effective return.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Liquidity risk</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          LuSE is a smaller exchange compared to larger global markets. Some counters trade infrequently and you may not always be able to sell shares quickly at the price you want. T-bills held to maturity are liquid at face value. Early redemption before maturity may be subject to market conditions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Tax</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Withholding Tax (WHT) of 15% applies to interest earned on T-bills and to dividends from LuSE-listed companies. MarketLink and Pangaea Securities deduct this at source. Capital gains on equity sales may also be subject to tax. Consult a Zambian tax advisor for your specific situation.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">AI and platform risk</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          AI-generated content on MarketLink is for information only. It can be wrong. Do not make investment decisions based solely on AI summaries or briefings. Platform downtime, data errors or technical failures could prevent you from executing orders at your intended price.
        </p>
      </section>
    </div>
  );
}
