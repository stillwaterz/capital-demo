"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Landmark,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { formatZMW, formatDateZM } from "@/lib/format";
import {
  floatSummary,
  liquidityLadder,
  listFloatAccounts,
  listFxRates,
  treasuryShortfall,
  type LiquidityLadderRow,
} from "@/lib/ops/treasury";
import type { FloatAccount } from "@/lib/ops/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdvanceClock } from "@/components/ops/advance-clock";
import { OpsDetailSheet } from "@/components/ops/ops-detail-sheet";
import { ProposeActionButton } from "@/components/ops/propose-action-button";
import {
  AlertBanner,
  EmptyState,
  OpsPage,
  PageHeading,
  SectionCard,
  StatCard,
  StatGrid,
  ToneBadge,
} from "@/components/ops/ops-kit";

function rateLabel(rateMicros: number): string {
  return (rateMicros / 1_000_000).toFixed(4);
}

export function TreasuryBoard() {
  const businessDate = useOpsClockStore((s) => s.businessDate);
  const accounts = listFloatAccounts();
  const float = floatSummary();
  const ladder = liquidityLadder(businessDate);
  const shortfall = treasuryShortfall(businessDate);
  const fxRates = listFxRates();

  const [selectedRail, setSelectedRail] = useState<FloatAccount | null>(null);
  const [selectedObligation, setSelectedObligation] =
    useState<LiquidityLadderRow | null>(null);

  return (
    <OpsPage>
      <PageHeading
        title="Treasury"
        description="Float across the six payment rails, a liquidity ladder against upcoming settlement obligations, ZMW FX for diaspora funding and a flagged pre-settlement shortfall."
        action={<AdvanceClock />}
      />

      <StatGrid>
        <StatCard
          label="Available float"
          value={formatZMW(float.availableNgwee)}
          hint="After minimum buffers"
          icon={Wallet}
        />
        <StatCard
          label="Next obligation"
          value={formatZMW(shortfall.requiredNgwee)}
          tone="warning"
          icon={Calendar}
        />
        <StatCard
          label="Shortfall"
          value={formatZMW(shortfall.shortfallNgwee)}
          tone={shortfall.hasShortfall ? "danger" : "positive"}
          icon={AlertTriangle}
        />
        <StatCard
          label="Total float"
          value={formatZMW(float.totalBalanceNgwee)}
          icon={Landmark}
        />
      </StatGrid>

      {shortfall.hasShortfall ? (
        <AlertBanner
          tone="danger"
          icon={AlertTriangle}
          title={`Pre-settlement shortfall on ${
            shortfall.settlementDate
              ? formatDateZM(shortfall.settlementDate)
              : "the next cycle"
          }`}
          description={`Funding need ${formatZMW(shortfall.requiredNgwee)} exceeds available float ${formatZMW(shortfall.availableNgwee)}. Top up ${formatZMW(shortfall.recommendedTopUpNgwee)} to clear it with headroom.`}
          action={
            <ProposeActionButton
              kind="FUND_FLOAT"
              summary={`Fund a treasury float top-up of ${formatZMW(shortfall.recommendedTopUpNgwee)} to clear the pre-settlement shortfall`}
              targetRef="TREASURY-SHORTFALL"
              label="Fund top-up"
              icon={Wallet}
              confirm={{
                title: "Fund a treasury float top-up",
                body: `This raises a proposal to top up the treasury float by ${formatZMW(shortfall.recommendedTopUpNgwee)} to clear the pre-settlement shortfall. A checker approves it before any money moves.`,
                confirmLabel: "Send to approvals",
              }}
            />
          }
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Float by rail" icon={Landmark} contentClassName="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rail</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Buffer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow
                  key={account.id}
                  onClick={() => setSelectedRail(account)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatZMW(account.balanceNgwee)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatZMW(account.minBufferNgwee)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard title="Liquidity ladder" icon={Calendar}>
          {ladder.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No upcoming obligations"
              description="Settlement funding needs will appear here as batches open."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Settlement</TableHead>
                  <TableHead className="text-right">Obligation</TableHead>
                  <TableHead className="text-right">Cumulative</TableHead>
                  <TableHead className="text-right">Cover</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ladder.map((row) => (
                  <TableRow
                    key={row.settlementDate}
                    onClick={() => setSelectedObligation(row)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">
                      {formatDateZM(row.settlementDate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatZMW(row.obligationNgwee)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatZMW(row.cumulativeNgwee)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ToneBadge tone={row.covered ? "positive" : "danger"}>
                        {row.covered ? "Covered" : "Short"}
                      </ToneBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Diaspora FX rates"
        icon={TrendingUp}
        description="Reference rates for diaspora funding into ZMW wallets."
        contentClassName="pt-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pair</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">ZMW per 1,000</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fxRates.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell className="font-medium">
                  {rate.base}/{rate.quote}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {rateLabel(rate.rateMicros)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatZMW((rate.rateMicros / 1_000_000) * 1_000 * 100)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <OpsDetailSheet
        open={selectedRail !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRail(null);
        }}
        title={selectedRail ? selectedRail.name : ""}
        subtitle={selectedRail ? "Float held on this payment rail" : undefined}
        badge={
          selectedRail ? (
            <ToneBadge
              tone={
                selectedRail.balanceNgwee > selectedRail.minBufferNgwee
                  ? "positive"
                  : "warning"
              }
            >
              {selectedRail.balanceNgwee > selectedRail.minBufferNgwee
                ? "Above buffer"
                : "At buffer"}
            </ToneBadge>
          ) : undefined
        }
        fields={
          selectedRail
            ? [
                { label: "Rail", value: selectedRail.rail },
                { label: "Account id", value: selectedRail.id, mono: true },
                {
                  label: "Balance",
                  value: formatZMW(selectedRail.balanceNgwee),
                  mono: true,
                },
                {
                  label: "Minimum buffer",
                  value: formatZMW(selectedRail.minBufferNgwee),
                  mono: true,
                },
                {
                  label: "Deployable",
                  value: formatZMW(
                    selectedRail.balanceNgwee - selectedRail.minBufferNgwee
                  ),
                  mono: true,
                },
              ]
            : []
        }
      />

      <OpsDetailSheet
        open={selectedObligation !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedObligation(null);
        }}
        title={
          selectedObligation
            ? formatDateZM(selectedObligation.settlementDate)
            : ""
        }
        subtitle={
          selectedObligation
            ? "Settlement obligation on the liquidity ladder"
            : undefined
        }
        badge={
          selectedObligation ? (
            <ToneBadge tone={selectedObligation.covered ? "positive" : "danger"}>
              {selectedObligation.covered ? "Covered" : "Short"}
            </ToneBadge>
          ) : undefined
        }
        fields={
          selectedObligation
            ? [
                {
                  label: "Settlement date",
                  value: formatDateZM(selectedObligation.settlementDate),
                },
                {
                  label: "Amount due",
                  value: formatZMW(selectedObligation.obligationNgwee),
                  mono: true,
                },
                {
                  label: "Cumulative",
                  value: formatZMW(selectedObligation.cumulativeNgwee),
                  mono: true,
                },
                { label: "Trades", value: selectedObligation.tradeCount },
                { label: "Cover status", value: selectedObligation.covered ? "Covered" : "Short" },
                {
                  label: "Shortfall",
                  value: formatZMW(
                    selectedObligation.covered
                      ? 0
                      : selectedObligation.cumulativeNgwee - float.availableNgwee
                  ),
                  mono: true,
                },
              ]
            : []
        }
      />
    </OpsPage>
  );
}
