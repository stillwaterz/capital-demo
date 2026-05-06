import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DEMO_PORTFOLIO,
  portfolioTotalNgwee,
  holdingCurrentValueNgwee,
  holdingPnLPercent,
} from "@/lib/mock/portfolio";
import { formatZMW } from "@/lib/format";
import { NEWS_ITEMS } from "@/lib/mock/news";
import { TBILL_TENORS } from "@/lib/mock/tbills";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ChangeLabel({ pct }: { pct: number }) {
  const positive = pct >= 0;
  return (
    <span
      className={`text-sm font-medium ${positive ? "text-green-700" : "text-red-600"}`}
    >
      {positive ? "+" : ""}
      {pct.toFixed(2)}%
    </span>
  );
}

export default function DashboardPage() {
  const totalNgwee = portfolioTotalNgwee(DEMO_PORTFOLIO);
  const topNews = NEWS_ITEMS.slice(0, 3);
  const nextAuction = TBILL_TENORS[0].nextAuctionDate;

  return (
    <div className="space-y-6">
      {/* Portfolio summary */}
      <section>
        <p className="text-sm text-muted-foreground">
          {DEMO_PORTFOLIO.displayName}&apos;s portfolio
        </p>
        <p className="text-3xl font-bold tracking-tight mt-0.5">
          {formatZMW(totalNgwee)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Equities and T-bills at current value
        </p>
      </section>

      {/* Equity holdings */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Equities
        </h2>
        <div className="space-y-2">
          {DEMO_PORTFOLIO.equities.map((holding) => {
            const currentValue = holdingCurrentValueNgwee(holding);
            const pnl = holdingPnLPercent(holding);
            return (
              <Link
                key={holding.instrument.symbol}
                href={`/equities/${holding.instrument.symbol}`}
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {holding.instrument.symbol}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {holding.sharesHeld.toLocaleString()} shares
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatZMW(currentValue)}
                      </p>
                      <ChangeLabel pct={pnl} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* T-bills strip */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            T-Bills
          </h2>
          <Link href="/tbills" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Next auction</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(nextAuction)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {DEMO_PORTFOLIO.tbills.length} holdings
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatZMW(
                    DEMO_PORTFOLIO.tbills.reduce(
                      (s, h) => s + h.faceValueNgwee,
                      0
                    )
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* News intelligence */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            News intelligence
          </h2>
          <Link href="/news" className="text-xs text-primary hover:underline">
            See all
          </Link>
        </div>
        <div className="space-y-3">
          {topNews.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-2 mb-1.5">
                  <Badge variant="outline" className="text-xs shrink-0">
                    {item.category}
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
    </div>
  );
}
