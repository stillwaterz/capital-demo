import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceChart } from "@/components/price-chart";
import { EquityActions } from "@/components/equity-actions";
import { getInstrument, INSTRUMENTS } from "@/lib/mock/instruments";
import { formatZMW, formatPercent, formatDateZM } from "@/lib/format";
import { newsBySymbol } from "@/lib/mock/news";

export function generateStaticParams() {
  return INSTRUMENTS.map((i) => ({ symbol: i.symbol }));
}

export default async function EquityDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const instrument = getInstrument(symbol);
  if (!instrument) notFound();

  const relatedNews = newsBySymbol(symbol);
  const positive = instrument.changePercent >= 0;

  const MOCK_RESEARCH = `${instrument.name} has shown consistent volume over the past 30 days. The counter trades on the Lusaka Securities Exchange and is part of the ${instrument.sector} sector. Recent price movement reflects broader sector trends and trading activity by institutional investors. Dividend payments have been in line with prior-year guidance. Investors should review the latest LuSE announcements for material updates before placing orders.`;

  return (
    <div className="space-y-5 pb-24">
      {/* Hero header */}
      <section>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {instrument.sector}
        </p>
        <h1 className="text-3xl font-bold tracking-tight font-display mt-0.5">
          {instrument.symbol}
        </h1>
        <p className="text-sm text-muted-foreground">{instrument.name}</p>
        <div className="flex items-baseline gap-3 mt-3">
          <p className="text-5xl font-bold tabular-nums font-display">
            {formatZMW(instrument.lastPriceNgwee)}
          </p>
          <span
            className={`px-2.5 py-0.5 rounded-full text-sm font-medium tabular-nums ${
              positive
                ? "bg-brand-copper/10 text-brand-copper"
                : "bg-red-50 text-red-600"
            }`}
          >
            {formatPercent(instrument.changePercent)} today
          </span>
        </div>
      </section>

      {/* Price chart */}
      <Card className="border border-brand-ink/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            30-day price
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PriceChart
            prices30d={instrument.prices30d}
            changePercent={instrument.changePercent}
          />
        </CardContent>
      </Card>

      {/* AI research card */}
      <Card className="border border-brand-ink/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">AI Research</CardTitle>
              <Badge variant="secondary" className="text-xs">Auto-generated</Badge>
            </div>
            <span className="text-xs text-muted-foreground">Refreshed 4 hours ago</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {MOCK_RESEARCH}
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Updated daily. Not financial advice. Always read the latest LuSE
            announcements.
          </p>
        </CardContent>
      </Card>

      {/* Related news */}
      {relatedNews.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            News
          </h2>
          <div className="space-y-3">
            {relatedNews.map((item) => (
              <Card key={item.id} className="border border-brand-ink/10">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-2 mb-1.5">
                    <Badge variant="outline" className="text-xs shrink-0">
                      {item.source}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {formatDateZM(item.timestamp)}
                    </p>
                  </div>
                  <p className="text-sm font-medium mb-1">{item.headline}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.summary}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Sticky buy/sell bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 flex gap-3 sm:hidden">
        <EquityActions
          symbol={instrument.symbol}
          name={instrument.name}
          lastPriceNgwee={instrument.lastPriceNgwee}
          mobile
        />
      </div>

      {/* Desktop actions inline */}
      <div className="hidden sm:block">
        <EquityActions
          symbol={instrument.symbol}
          name={instrument.name}
          lastPriceNgwee={instrument.lastPriceNgwee}
        />
      </div>
    </div>
  );
}
