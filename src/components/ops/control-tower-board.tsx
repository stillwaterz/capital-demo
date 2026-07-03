"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Layers,
  Scale,
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
import { AdvanceClock } from "@/components/ops/advance-clock";
import { Button } from "@/components/ui/button";
import {
  ActionLink,
  EmptyState,
  OpsPage,
  PageHeading,
  PriorityItem,
  SectionCard,
  StatCard,
  StatGrid,
  ToneBadge,
} from "@/components/ops/ops-kit";
import { cn } from "@/lib/utils";

export function ControlTowerBoard() {
  const [guideOpen, setGuideOpen] = useState(false);
  const businessDate = useOpsClockStore((s) => s.businessDate);
  const orders = useCustomerOrdersStore((s) => s.orders);
  const proposals = useOpsGovernanceStore((s) => s.proposals);
  const pendingProposals = useMemo(
    () => proposals.filter((p) => p.status === "PENDING"),
    [proposals]
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

  const openBreaks = breaks.filter((b) => b.status === "OPEN");

  return (
    <OpsPage>
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
          icon={Layers}
          tone="brand"
          href="/ops/settlement"
        />
        <StatCard
          label="Settlement fails"
          value={String(settlement.failCount)}
          tone={settlement.failCount > 0 ? "danger" : "positive"}
          icon={AlertTriangle}
          href="/ops/settlement"
        />
        <StatCard
          label="Open recon breaks"
          value={String(recon.openBreaks)}
          tone={recon.openBreaks > 0 ? "warning" : "positive"}
          icon={Scale}
          href="/ops/reconciliation"
        />
        <StatCard
          label="Pending approvals"
          value={String(pendingProposals.length)}
          tone={pendingProposals.length > 0 ? "warning" : "neutral"}
          icon={ClipboardCheck}
          href="/ops/approvals"
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Treasury and settlement" icon={Wallet}>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Pending funding</span>
              <span className="font-medium tabular-nums">
                {formatZMW(settlement.pendingFundingNgwee)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
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
            <ActionLink href="/ops/settlement">Open settlement</ActionLink>
          </div>
        </SectionCard>

        <SectionCard title="Compliance and risk" icon={Shield}>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Open AML alerts</span>
              <span className="font-medium">{compliance.openAlerts}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">KYC in review</span>
              <span className="font-medium">{kyc.inReview}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Kill switch</span>
              <ToneBadge tone={risk.killSwitchMode === "HALTED" ? "danger" : "positive"}>
                {risk.killSwitchMode === "HALTED" ? "Engaged" : "Off"}
              </ToneBadge>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Overdue returns</span>
              <span className="font-medium">{reporting.overdue}</span>
            </div>
            <ActionLink href="/ops/compliance">Open compliance</ActionLink>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Priority queue"
        icon={AlertTriangle}
        iconClassName="text-destructive"
      >
        {fails.length === 0 && openBreaks.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Queue clear"
            description="No settlement fails or recon breaks on this business date."
          />
        ) : (
          <div className="space-y-2">
            {fails.slice(0, 3).map((fail) => (
              <PriorityItem
                key={fail.tradeId}
                tone="danger"
                href="/ops/settlement"
                title={`Settlement fail: ${fail.tradeId}`}
                detail={`${fail.clientName} - ${fail.reason}`}
              />
            ))}
            {openBreaks.slice(0, 2).map((brk) => (
              <PriorityItem
                key={brk.id}
                tone="warning"
                href="/ops/reconciliation"
                title={`Recon break: ${brk.id}`}
                detail={`${brk.label}${brk.cause ? ` - ${brk.cause}` : ""}`}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <div className="rounded-xl border bg-card/80">
        <button
          type="button"
          onClick={() => setGuideOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/40"
          aria-expanded={guideOpen}
        >
          <span>Demo walkthrough</span>
          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 text-muted-foreground transition-transform",
              guideOpen && "rotate-180"
            )}
          />
        </button>
        {guideOpen ? (
          <div className="space-y-2 border-t px-4 py-4 text-sm text-muted-foreground">
            <p>1. Place a trade in the customer app, then switch to Operations.</p>
            <p>2. See it on the settlement board with an App badge.</p>
            <p>3. Advance to T+1 and watch it settle.</p>
            <p>
              4. Open the ops copilot, send a proposal to approvals and approve as
              checker.
            </p>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/ops/approvals" />}
              className="mt-2"
            >
              Go to approvals
            </Button>
          </div>
        ) : null}
      </div>
    </OpsPage>
  );
}
