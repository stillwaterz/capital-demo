"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Shield,
  Wallet,
} from "lucide-react";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { useCustomerOrdersStore } from "@/lib/store/customer-orders";
import { useOpsGovernanceStore } from "@/lib/store/ops-governance";
import { customerOrderToTrade } from "@/lib/ops/customer-trades";
import { settlementSummary, listSettlementFails } from "@/lib/ops/settlement";
import { reconSummary, listReconBreaks } from "@/lib/ops/reconciliation";
import { treasurySummary, treasuryShortfall } from "@/lib/ops/treasury";
import { complianceSummary } from "@/lib/ops/compliance";
import { kycSummary } from "@/lib/ops/kyc-queue";
import { riskSummary } from "@/lib/ops/risk";
import { regReportingSummary } from "@/lib/ops/reg-reporting";
import { groupTradesByState } from "@/lib/ops/trades";
import { formatDateZM, formatZMW } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdvanceClock } from "@/components/ops/advance-clock";
import {
  PageHeading,
  StatCard,
  StatGrid,
  ToneBadge,
} from "@/components/ops/ops-kit";

export function ControlTowerBoard() {
  const businessDate = useOpsClockStore((s) => s.businessDate);
  const orders = useCustomerOrdersStore((s) => s.orders);
  const pendingProposals = useOpsGovernanceStore((s) =>
    s.proposals.filter((p) => p.status === "PENDING")
  );

  const extraTrades = useMemo(
    () => orders.map((o) => customerOrderToTrade(o, businessDate)),
    [orders, businessDate]
  );

  const settlement = settlementSummary(businessDate, extraTrades);
  const recon = reconSummary(businessDate);
  const treasury = treasurySummary(businessDate);
  const shortfall = treasuryShortfall(businessDate);
  const compliance = complianceSummary();
  const kyc = kycSummary();
  const risk = riskSummary();
  const reporting = regReportingSummary(businessDate);
  const grouped = groupTradesByState(businessDate, extraTrades);
  const fails = listSettlementFails(businessDate, extraTrades);
  const breaks = listReconBreaks(businessDate);

  const activeTrades =
    grouped.EXECUTED.length +
    grouped.CONFIRMED.length +
    grouped.CLEARING.length;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Control Tower"
        description={`Operations snapshot for ${formatDateZM(businessDate)}. Settlement, reconciliation, treasury, compliance and approvals in one view.`}
        action={<AdvanceClock />}
      />

      <StatGrid>
        <StatCard
          label="Active trades"
          value={String(activeTrades)}
          hint={`${orders.length} from customer app`}
        />
        <StatCard
          label="Settlement fails"
          value={String(settlement.failCount)}
          tone={settlement.failCount > 0 ? "danger" : "positive"}
        />
        <StatCard
          label="Open recon breaks"
          value={String(recon.openBreaks)}
          tone={recon.openBreaks > 0 ? "warning" : "positive"}
        />
        <StatCard
          label="Pending approvals"
          value={String(pendingProposals.length)}
          tone={pendingProposals.length > 0 ? "warning" : "neutral"}
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet size={16} className="text-brand-green" />
              Treasury and settlement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending funding</span>
              <span className="font-medium tabular-nums">
                {formatZMW(settlement.pendingFundingNgwee)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Float health</span>
              <ToneBadge tone={!treasury.hasShortfall ? "positive" : "warning"}>
                {!treasury.hasShortfall ? "Healthy" : "Watch"}
              </ToneBadge>
            </div>
            {shortfall.hasShortfall && shortfall.settlementDate ? (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                Pre-settlement shortfall of {formatZMW(shortfall.shortfallNgwee)}{" "}
                on {formatDateZM(shortfall.settlementDate)}.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No immediate treasury shortfall flagged.
              </p>
            )}
            <Link
              href="/ops/settlement"
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
            >
              Open settlement
              <ArrowRight size={14} />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield size={16} className="text-brand-green" />
              Compliance and risk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open AML alerts</span>
              <span className="font-medium">{compliance.openAlerts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">KYC in review</span>
              <span className="font-medium">{kyc.inReview}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kill switch</span>
              <ToneBadge tone={risk.killSwitchMode === "HALTED" ? "danger" : "positive"}>
                {risk.killSwitchMode === "HALTED" ? "Engaged" : "Off"}
              </ToneBadge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Overdue returns</span>
              <span className="font-medium">{reporting.overdue}</span>
            </div>
            <Link
              href="/ops/compliance"
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
            >
              Open compliance
              <ArrowRight size={14} />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle size={16} className="text-destructive" />
              Priority queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {fails.length === 0 && breaks.length === 0 ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <CheckCircle2 size={16} className="text-emerald-600" />
                No settlement fails or recon breaks on this date.
              </div>
            ) : (
              <>
                {fails.slice(0, 3).map((fail) => (
                  <div
                    key={fail.tradeId}
                    className="rounded-lg border px-3 py-2 text-sm"
                  >
                    <p className="font-medium">
                      Settlement fail: {fail.tradeId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fail.clientName} - {fail.reason}
                    </p>
                  </div>
                ))}
                {breaks
                  .filter((b) => b.status === "OPEN")
                  .slice(0, 2)
                  .map((brk) => (
                    <div
                      key={brk.id}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      <p className="font-medium">Recon break: {brk.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {brk.label}
                        {brk.cause ? ` - ${brk.cause}` : ""}
                      </p>
                    </div>
                  ))}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Demo walkthrough</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 text-sm text-muted-foreground">
            <p>
              1. Place a trade in the customer app, then switch to Operations.
            </p>
            <p>2. See it on the settlement board with an App badge.</p>
            <p>3. Advance to T+1 and watch it settle.</p>
            <p>
              4. Open the ops copilot, send a proposal to approvals and approve
              as checker.
            </p>
            <Link
              href="/ops/approvals"
              className="inline-flex h-7 items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted mt-2"
            >
              Go to approvals
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
