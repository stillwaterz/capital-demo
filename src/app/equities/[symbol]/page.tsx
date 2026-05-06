import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceChart } from "@/components/price-chart";
import { EquityActions } from "@/components/equity-actions";
import { getInstrument, formatZMW, INSTRUMENTS } from "@/lib/mock/instruments";
import { newsBySymbol } from "@/lib/mock/news";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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
    <div className="space-y-5">
      {/* Header */}
      <section>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {instrument.sector}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              {instrument.symbol}
            </h1>
            <p className="text-sm text-muted-foreground">{instrument.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {formatZMW(instrument.lastPriceNgwee)}
            </p>
            <span
              className={`text-sm font-medium ${positive ? "text-green-700" : "text-red-600"}`}
            >
              {positive ? "+" : ""}
              {instrument.changePercent.toFixed(2)}% today
            </span>
          </div>
        </div>
      </section>

      {/* Price chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            30-day price (ZMW)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PriceChart
            prices30d={instrument.prices30d}
            changePercent={instrument.changePercent}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <EquityActions
        symbol={instrument.symbol}
        name={instrument.name}
        lastPriceNgwee={instrument.lastPriceNgwee}
      />

      {/* AI research card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">
              AI Research
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              Auto-generated
            </Badge>
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
              <Card key={item.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-2 mb-1.5">
                    <Badge variant="outline" className="text-xs shrink-0">
                      {item.source}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.timestamp)}
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
    </div>
  );
}
