import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INSTRUMENTS } from "@/lib/mock/instruments";
import { formatZMW, formatPercent } from "@/lib/format";

export default function EquitiesPage() {
  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-bold tracking-tight font-display">LuSE Equities</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All counters on the Lusaka Securities Exchange.
        </p>
      </section>

      <div className="space-y-2">
        {INSTRUMENTS.map((ins) => {
          const positive = ins.changePercent >= 0;
          return (
            <Link key={ins.symbol} href={`/equities/${ins.symbol}`}>
              <Card className="border border-brand-ink/10 hover:-translate-y-0.5 hover:border-brand-green/40 transition-all">
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-brand-ink">{ins.symbol}</p>
                      <Badge variant="outline" className="text-xs">
                        {ins.sector}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{ins.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm tabular-nums">
                      {formatZMW(ins.lastPriceNgwee)}
                    </p>
                    <span
                      className={`text-xs font-medium tabular-nums ${positive ? "text-brand-copper" : "text-red-600"}`}
                    >
                      {formatPercent(ins.changePercent)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
