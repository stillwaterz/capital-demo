import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeading, StatCard } from "@/components/ops/ops-stat";
import { BreachBadge, KillSwitchBadge } from "@/components/ops/ops-badges";
import {
  EXPOSURE_ROWS,
  RISK_LIMITS,
  formatBps,
  getKillSwitch,
  riskSummary,
} from "@/lib/ops/risk";
import type { RiskLimit } from "@/lib/ops/types";
import { formatZMW } from "@/lib/format";

function formatLimitValue(limit: RiskLimit): string {
  return limit.type === "CONCENTRATION"
    ? formatBps(limit.limitValue)
    : formatZMW(limit.limitValue);
}

function formatCurrentValue(limit: RiskLimit): string {
  return limit.type === "CONCENTRATION"
    ? formatBps(limit.currentValue)
    : formatZMW(limit.currentValue);
}

export default function RiskPage() {
  const summary = riskSummary();
  const killSwitch = getKillSwitch();

  return (
    <div className="space-y-6">
      <PageHeading
        title="Risk"
        description="Position and concentration limits, the live exposure book and the trading kill switch."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Book exposure"
          value={formatZMW(summary.totalBookNgwee)}
          hint="Equities and T-bills"
        />
        <StatCard
          label="Limits breached"
          value={summary.breachedLimits}
          hint={`${summary.totalLimits} monitored`}
          emphasis={summary.breachedLimits > 0 ? "warn" : "good"}
        />
        <StatCard
          label="Top name"
          value={`${summary.topNameSymbol} ${formatBps(summary.topNameShareBps)}`}
          hint="Largest single holding"
        />
        <StatCard
          label="Trading"
          value={killSwitch.label}
          emphasis={killSwitch.mode === "LIVE" ? "good" : "warn"}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Trading kill switch</CardTitle>
            <CardDescription>{killSwitch.reason}</CardDescription>
          </div>
          <KillSwitchBadge mode={killSwitch.mode} />
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Scope: <span className="font-medium text-foreground">{killSwitch.scope.replace("_", " ")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm">
              {killSwitch.mode === "LIVE" ? "Halt all trading" : "Resume trading"}
            </Button>
            <span className="text-xs text-muted-foreground">Routes to approvals</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk limits</CardTitle>
          <CardDescription>
            Current book values checked against position, concentration, exposure and VaR limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Limit</th>
                <th className="py-2 pr-3 text-right font-medium">Threshold</th>
                <th className="py-2 pr-3 text-right font-medium">Current</th>
                <th className="py-2 pl-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {RISK_LIMITS.map((limit) => (
                <tr key={limit.id} className="border-b align-top last:border-0">
                  <td className="py-3 pr-3">
                    <Badge variant="outline">{limit.type}</Badge>
                  </td>
                  <td className="py-3 pr-3 font-medium">{limit.label}</td>
                  <td className="py-3 pr-3 text-right whitespace-nowrap tabular-nums">
                    {formatLimitValue(limit)}
                  </td>
                  <td className="py-3 pr-3 text-right whitespace-nowrap tabular-nums">
                    {formatCurrentValue(limit)}
                  </td>
                  <td className="py-3 pl-3">
                    <BreachBadge breached={limit.breached} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exposure dashboard</CardTitle>
          <CardDescription>
            Net exposure by instrument with each name as a share of the total book.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Symbol</th>
                <th className="py-2 pr-3 font-medium">Asset class</th>
                <th className="py-2 pr-3 text-right font-medium">Exposure</th>
                <th className="py-2 pl-3 text-right font-medium">Book share</th>
              </tr>
            </thead>
            <tbody>
              {EXPOSURE_ROWS.map((row) => (
                <tr key={row.symbol} className="border-b last:border-0">
                  <td className="py-3 pr-3 font-medium">{row.symbol}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{row.assetClass}</td>
                  <td className="py-3 pr-3 text-right whitespace-nowrap tabular-nums">
                    {formatZMW(row.exposureNgwee)}
                  </td>
                  <td className="py-3 pl-3 text-right whitespace-nowrap tabular-nums">
                    {formatBps(row.shareBps)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
