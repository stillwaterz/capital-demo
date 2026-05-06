import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DEMO_PORTFOLIO,
  portfolioTotalNgwee,
  holdingCurrentValueNgwee,
  holdingPnLPercent,
} from "@/lib/mock/portfolio";
import { formatZMW, formatPercent, formatDateZM } from "@/lib/format";
import { TBILL_TENORS } from "@/lib/mock/tbills";
import { Greeting } from "@/components/greeting";
import { PortfolioHeader } from "@/components/portfolio-header";
import { AiBriefing } from "@/components/ai-briefing";
import { MarketPulse } from "@/components/market-pulse";
import { SmartSuggestion } from "@/components/smart-suggestion";
import { GoalsWidget } from "@/components/goals-widget";
import { getMergedNews } from "@/lib/data/merged-news";

export const revalidate = 1800;

function ChangeLabel({ pct }: { pct: number }) {
  const positive = pct >= 0;
  return (
    <span
      className={`text-base font-medium tabular-nums ${positive ? "text-brand-copper" : "text-red-600"}`}
    >
      {formatPercent(pct)}
    </span>
  );
}

export default async function DashboardPage() {
  const totalNgwee = portfolioTotalNgwee(DEMO_PORTFOLIO);
  const mergedNews = await getMergedNews(3);
  const nextAuction = TBILL_TENORS[0].nextAuctionDate;

  return (
    <div className="space-y-8">
      <Greeting />

      <AiBriefing />

      <MarketPulse />

      <PortfolioHeader totalNgwee={totalNgwee} fallbackName={DEMO_PORTFOLIO.displayName} />

      <SmartSuggestion />

      {/* Equity holdings */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Equities
        </h2>
        <div className="space-y-3">
          {DEMO_PORTFOLIO.equities.map((holding) => {
            const currentValue = holdingCurrentValueNgwee(holding);
            const pnl = holdingPnLPercent(holding);
            return (
              <Link
                key={holding.instrument.symbol}
                href={`/equities/${holding.instrument.symbol}`}
                className="block"
              >
                <Card className="border border-brand-ink/10 hover:-translate-y-0.5 hover:border-brand-green/40 transition-all">
                  <CardContent className="py-4 px-5 flex items-center justify-between min-h-16">
                    <div>
                      <p className="font-semibold text-base text-brand-ink">
                        {holding.instrument.symbol}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {holding.sharesHeld.toLocaleString()} shares
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-base tabular-nums">
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
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            T-Bills
          </h2>
          <Link href="/tbills" className="text-sm text-brand-green hover:underline">
            View all
          </Link>
        </div>
        <Card className="border border-brand-ink/10">
          <CardContent className="py-4 px-5 min-h-16">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium">Next auction</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateZM(nextAuction)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-base font-medium tabular-nums">
                  {DEMO_PORTFOLIO.tbills.length} holdings
                </p>
                <p className="text-sm text-muted-foreground tabular-nums">
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

      <GoalsWidget />

      {/* News intelligence */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            News intelligence
          </h2>
          <Link href="/news" className="text-sm text-brand-green hover:underline">
            See all
          </Link>
        </div>
        <div className="space-y-3">
          {mergedNews.map((item) => (
            <Card key={item.id} className="border border-brand-ink/10">
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-2 mb-2">
                  {item.isLive ? (
                    <Badge className="text-xs shrink-0 bg-brand-green/10 text-brand-green border-brand-green/20">
                      Lusaka Times
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {item.category}
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDateZM(item.isLive ? item.publishedAt : item.timestamp)}
                  </p>
                </div>
                <p className="text-base font-medium mb-1">{item.headline}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.summary}
                </p>
                {item.isLive && item.url && (
                  <Link
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-green hover:underline mt-2 inline-block"
                  >
                    Read full article
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      {/* Footer */}
      <div className="pt-2 pb-6 text-center">
        <Link href="/data-sources" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
          Data sources
        </Link>
      </div>
    </div>
  );
}
