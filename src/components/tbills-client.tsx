"use client";

import { useEffect, useState } from "react";
import { Calendar, RefreshCw, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TBILL_TENORS } from "@/lib/mock/tbills";
import { useTBillsStore } from "@/lib/store/tbills";
import { formatDateZM, formatYield, formatZMW } from "@/lib/format";
import { cn } from "@/lib/utils";

function AutoRollToggle({
  holdingId,
  enabled,
}: {
  holdingId: string;
  enabled: boolean;
}) {
  const setAutoRoll = useTBillsStore((s) => s.setAutoRoll);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Auto-roll on maturity"
      onClick={() => setAutoRoll(holdingId, !enabled)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
        enabled ? "bg-brand-green" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow transition-transform",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export function TBillsClient() {
  const [mounted, setMounted] = useState(false);
  const holdings = useTBillsStore((s) => s.holdings);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          T-Bills
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          GRZ treasury bills. Bid at the next BoZ auction or manage your
          holdings. Auto-roll keeps your money working when a bill matures.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Available tenors
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {TBILL_TENORS.map((tenor) => (
            <Card key={tenor.days} className="border border-brand-ink/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tenor.label}</CardTitle>
                  <Badge variant="outline">{formatYield(tenor.yieldPercent)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar size={14} />
                  Next auction {formatDateZM(tenor.nextAuctionDate)}
                </div>
                <Button className="w-full bg-brand-green hover:bg-brand-green-light text-brand-cream">
                  Place bid (demo)
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Your holdings
        </h2>
        {holdings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No T-bill holdings yet. Place a bid at the next auction.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {holdings.map((holding) => (
              <Card key={holding.id} className="border border-brand-ink/10">
                <CardContent className="py-5 px-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        <TrendingUp size={16} className="text-brand-green" />
                        {holding.tenorDays} day GRZ T-bill
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Face value {formatZMW(holding.faceValueNgwee)}
                      </p>
                    </div>
                    <Badge className="bg-brand-copper/10 text-brand-copper border-brand-copper/20">
                      {formatYield(holding.purchaseYieldPercent)} at purchase
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Matures {formatDateZM(holding.maturityDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">Auto-roll on maturity</p>
                      <p className="text-xs text-muted-foreground">
                        Reinvest principal into the next {holding.tenorDays} day
                        auction automatically
                      </p>
                    </div>
                    <AutoRollToggle
                      holdingId={holding.id}
                      enabled={holding.autoRoll}
                    />
                  </div>
                  {holding.autoRoll ? (
                    <p className="text-xs text-brand-green flex items-center gap-1">
                      <RefreshCw size={12} />
                      Auto-roll is on. Ops will fire a fresh bid on maturity.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Demo only. 15% WHT applies to T-bill interest in production. Maturity
        and auto-roll events appear in the ops corporate actions screen.
      </p>
    </div>
  );
}
