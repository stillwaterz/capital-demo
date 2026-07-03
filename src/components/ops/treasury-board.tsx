"use client";

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
} from "@/lib/ops/treasury";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdvanceClock } from "@/components/ops/advance-clock";
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
          action={<ToneBadge tone="danger">Action needed</ToneBadge>}
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
                <TableRow key={account.id}>
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
                  <TableRow key={row.settlementDate}>
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
    </OpsPage>
  );
}
