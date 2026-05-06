import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AutorollToggle } from "@/components/autoroll-toggle";
import { TBILL_TENORS, netYieldAfterWHT } from "@/lib/mock/tbills";
import { DEMO_PORTFOLIO } from "@/lib/mock/portfolio";
import { formatZMW } from "@/lib/format";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysToMaturity(maturityDate: string): number {
  const diff =
    new Date(maturityDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function TBillsPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">T-Bills</h1>
        <p className="text-sm text-muted-foreground mt-1">
          GRZ government T-bills via the Bank of Zambia auction. WHT of 15%
          applies to all interest earned.
        </p>
      </section>

      {/* My holdings */}
      {DEMO_PORTFOLIO.tbills.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            My holdings
          </h2>
          <div className="space-y-3">
            {DEMO_PORTFOLIO.tbills.map((holding, idx) => {
              const days = daysToMaturity(holding.maturityDate);
              const netYield = netYieldAfterWHT(holding.tenor.yieldPercent);
              return (
                <Card key={idx}>
                  <CardContent className="py-4 px-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">
                          {holding.tenor.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Matures {formatDate(holding.maturityDate)} - {days}{" "}
                          days left
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {formatZMW(holding.faceValueNgwee)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          face value
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Gross yield: {holding.tenor.yieldPercent.toFixed(2)}% -
                        Net after WHT: {netYield.toFixed(2)}%
                      </span>
                    </div>
                    <AutorollToggle initialValue={holding.autoRoll} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Available tenors */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Available at next auction - {formatDate(TBILL_TENORS[0].nextAuctionDate)}
        </h2>
        <div className="space-y-3">
          {TBILL_TENORS.map((tenor) => {
            const netYield = netYieldAfterWHT(tenor.yieldPercent);
            return (
              <Card key={tenor.tenorDays}>
                <CardContent className="py-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-sm">{tenor.label}</p>
                        <Badge variant="outline" className="text-xs">
                          {tenor.tenorDays}d
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Min bid {formatZMW(tenor.minBidZMW * 100)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-700">
                        {tenor.yieldPercent.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {netYield.toFixed(2)}% net after WHT
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button size="sm" className="w-full" variant="outline">
                      Place bid (demo)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-muted-foreground pb-2">
        Yields shown are from the last auction on{" "}
        {formatDate(TBILL_TENORS[0].lastAuctionDate)}. Actual allotment rates
        vary by auction.
      </p>
    </div>
  );
}
