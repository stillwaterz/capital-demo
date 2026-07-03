import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  DEMO_PORTFOLIO,
  portfolioTotalNgwee,
  portfolioPnLNgwee,
  portfolioPnLPercent,
  holdingCurrentValueNgwee,
  holdingPnLNgwee,
  holdingPnLPercent,
} from "@/lib/mock/portfolio";
import { formatZMW, formatPercent } from "@/lib/format";
import { OrderTracker } from "@/components/order-tracker";

function GainLabel({ ngwee, pct }: { ngwee: number; pct: number }) {
  const positive = ngwee >= 0;
  const tone = positive ? "text-brand-copper" : "text-red-600";
  return (
    <span className={`tabular-nums ${tone}`}>
      {positive ? "+" : "-"}
      {formatZMW(Math.abs(ngwee))} ({formatPercent(pct)})
    </span>
  );
}

export default function PortfolioPage() {
  const totalNgwee = portfolioTotalNgwee(DEMO_PORTFOLIO);
  const pnlNgwee = portfolioPnLNgwee(DEMO_PORTFOLIO);
  const pnlPct = portfolioPnLPercent(DEMO_PORTFOLIO);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          Your portfolio
        </h1>
        <Card className="border border-brand-ink/10">
          <CardContent className="py-6 px-5">
            <p className="text-sm text-muted-foreground">Total value</p>
            <p className="text-3xl font-semibold tabular-nums mt-1">
              {formatZMW(totalNgwee)}
            </p>
            <p className="text-sm mt-2">
              <GainLabel ngwee={pnlNgwee} pct={pnlPct} />{" "}
              <span className="text-muted-foreground">all time</span>
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Holdings
        </h2>
        <div className="space-y-3">
          {DEMO_PORTFOLIO.equities.map((holding) => (
            <Link
              key={holding.instrument.symbol}
              href={`/equities/${holding.instrument.symbol}`}
              className="block"
            >
              <Card className="border border-brand-ink/10 hover:border-brand-green/40 transition-all">
                <CardContent className="py-4 px-5 flex items-center justify-between min-h-16">
                  <div>
                    <p className="font-semibold text-brand-ink">
                      {holding.instrument.symbol}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {holding.sharesHeld.toLocaleString()} shares
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium tabular-nums">
                      {formatZMW(holdingCurrentValueNgwee(holding))}
                    </p>
                    <p className="text-sm">
                      <GainLabel
                        ngwee={holdingPnLNgwee(holding)}
                        pct={holdingPnLPercent(holding)}
                      />
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Orders in progress
        </h2>
        <OrderTracker />
      </section>
    </div>
  );
}
