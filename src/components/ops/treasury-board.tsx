"use client";

import { AlertTriangle, TrendingUp } from "lucide-react";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  PageHeading,
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
    <div className="space-y-6">
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
        />
        <StatCard
          label="Next obligation"
          value={formatZMW(shortfall.requiredNgwee)}
          tone="warning"
        />
        <StatCard
          label="Shortfall"
          value={formatZMW(shortfall.shortfallNgwee)}
          tone={shortfall.hasShortfall ? "danger" : "positive"}
        />
        <StatCard
          label="Total float"
          value={formatZMW(float.totalBalanceNgwee)}
        />
      </StatGrid>

      {shortfall.hasShortfall ? (
        <Card className="ring-destructive/30">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 text-destructive" size={20} />
              <div className="space-y-0.5">
                <p className="font-medium">
                  Pre-settlement shortfall on{" "}
                  {shortfall.settlementDate
                    ? formatDateZM(shortfall.settlementDate)
                    : "the next cycle"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Funding need {formatZMW(shortfall.requiredNgwee)} exceeds
                  available float {formatZMW(shortfall.availableNgwee)}. Top up{" "}
                  {formatZMW(shortfall.recommendedTopUpNgwee)} to clear it with
                  headroom.
                </p>
              </div>
            </div>
            <ToneBadge tone="danger">Action needed</ToneBadge>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Float by rail</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Liquidity ladder</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {ladder.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No upcoming settlement obligations.
              </p>
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
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-green" />
            Diaspora FX rates
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
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
                    {formatZMW(rate.rateMicros / 1_000_000 * 1_000 * 100)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
