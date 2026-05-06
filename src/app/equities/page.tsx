import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INSTRUMENTS, formatZMW } from "@/lib/mock/instruments";

export default function EquitiesPage() {
  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">LuSE Equities</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All counters on the Lusaka Securities Exchange.
        </p>
      </section>

      <div className="space-y-2">
        {INSTRUMENTS.map((ins) => {
          const positive = ins.changePercent >= 0;
          return (
            <Link key={ins.symbol} href={`/equities/${ins.symbol}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{ins.symbol}</p>
                      <Badge variant="outline" className="text-xs">
                        {ins.sector}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{ins.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {formatZMW(ins.lastPriceNgwee)}
                    </p>
                    <span
                      className={`text-xs font-medium ${positive ? "text-green-700" : "text-red-600"}`}
                    >
                      {positive ? "+" : ""}
                      {ins.changePercent.toFixed(2)}%
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
