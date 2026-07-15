import {
  AlertTriangle,
  Gauge,
  PieChart,
  Power,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertBanner,
  OpsPage,
  PageHeading,
  SectionCard,
  StatCard,
  StatGrid,
} from "@/components/ops/ops-kit";
import { BreachBadge, KillSwitchBadge } from "@/components/ops/ops-badges";
import { ProposeActionButton } from "@/components/ops/propose-action-button";
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
    <OpsPage>
      <PageHeading
        title="Risk"
        description="Position and concentration limits, the live exposure book and the trading kill switch."
      />

      <StatGrid>
        <StatCard
          label="Book exposure"
          value={formatZMW(summary.totalBookNgwee)}
          hint="Equity book"
          icon={Gauge}
        />
        <StatCard
          label="Limits breached"
          value={String(summary.breachedLimits)}
          hint={`${summary.totalLimits} monitored`}
          tone={summary.breachedLimits > 0 ? "danger" : "positive"}
          icon={AlertTriangle}
        />
        <StatCard
          label="Top name"
          value={`${summary.topNameSymbol} ${formatBps(summary.topNameShareBps)}`}
          hint="Largest single holding"
          icon={PieChart}
        />
        <StatCard
          label="Trading"
          value={killSwitch.label}
          tone={killSwitch.mode === "LIVE" ? "positive" : "danger"}
          icon={Power}
        />
      </StatGrid>

      <SectionCard
        title="Trading kill switch"
        icon={Power}
        description={killSwitch.reason}
        action={<KillSwitchBadge mode={killSwitch.mode} />}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Scope:{" "}
            <span className="font-medium text-foreground">
              {killSwitch.scope.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ProposeActionButton
              kind="KILL_SWITCH"
              summary={
                killSwitch.mode === "LIVE"
                  ? "Halt all trading via the kill switch"
                  : "Resume trading and release the kill switch"
              }
              targetRef={`KILL-${killSwitch.scope}`}
              label={
                killSwitch.mode === "LIVE" ? "Halt all trading" : "Resume trading"
              }
              iconName="power"
              variant="destructive"
              size="sm"
              confirm={{
                title:
                  killSwitch.mode === "LIVE"
                    ? "Halt all trading?"
                    : "Resume trading?",
                body:
                  killSwitch.mode === "LIVE"
                    ? "This raises a kill switch proposal for a risk officer to approve. No trading stops until a human checker approves it."
                    : "This raises a proposal to resume trading for a risk officer to approve.",
                confirmLabel: "Send to approvals",
              }}
            />
            <span className="text-xs text-muted-foreground">
              Routes to approvals
            </span>
          </div>
        </div>
      </SectionCard>

      {summary.breachedLimits > 0 ? (
        <AlertBanner
          tone="warning"
          icon={AlertTriangle}
          title={`${summary.breachedLimits} limit${summary.breachedLimits === 1 ? "" : "s"} breached`}
          description="Review the exposure book and consider halting new orders in the affected names."
        />
      ) : null}

      <SectionCard
        title="Risk limits"
        icon={Gauge}
        description="Current book values checked against position, concentration, exposure and VaR limits."
        contentClassName="pt-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Limit</TableHead>
              <TableHead className="text-right">Threshold</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {RISK_LIMITS.map((limit) => (
              <TableRow key={limit.id} className="align-top">
                <TableCell>
                  <Badge variant="outline">{limit.type}</Badge>
                </TableCell>
                <TableCell className="font-medium">{limit.label}</TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatLimitValue(limit)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatCurrentValue(limit)}
                </TableCell>
                <TableCell>
                  <BreachBadge breached={limit.breached} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title="Exposure dashboard"
        icon={PieChart}
        description="Net exposure by instrument with each name as a share of the total book."
        contentClassName="pt-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Asset class</TableHead>
              <TableHead className="text-right">Exposure</TableHead>
              <TableHead className="text-right">Book share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EXPOSURE_ROWS.map((row) => (
              <TableRow key={row.symbol}>
                <TableCell className="font-medium">{row.symbol}</TableCell>
                <TableCell className="text-muted-foreground">{row.assetClass}</TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatZMW(row.exposureNgwee)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatBps(row.shareBps)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </OpsPage>
  );
}
