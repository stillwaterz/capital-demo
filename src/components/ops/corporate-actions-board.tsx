"use client";

import { RefreshCw } from "lucide-react";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { formatZMW, formatDateZM } from "@/lib/format";
import type {
  CorporateActionStatus,
  CorporateActionType,
} from "@/lib/ops/types";
import {
  corporateActionSummary,
  listAutoRolls,
  listCorporateActions,
} from "@/lib/ops/corporate-actions";
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

const TYPE_LABELS: Record<CorporateActionType, string> = {
  DIVIDEND: "Dividend",
  COUPON: "Coupon",
  MATURITY: "Maturity",
  AUTO_ROLL: "Auto-roll",
};

function statusTone(status: CorporateActionStatus) {
  switch (status) {
    case "PROCESSED":
      return "positive" as const;
    case "FAILED":
      return "danger" as const;
    default:
      return "warning" as const;
  }
}

export function CorporateActionsBoard() {
  const businessDate = useOpsClockStore((s) => s.businessDate);
  const actions = listCorporateActions(businessDate);
  const autoRolls = listAutoRolls(businessDate);
  const summary = corporateActionSummary(businessDate);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Corporate Actions"
        description="Dividend runs, T-bill coupons and maturities, and auto-roll that fires a fresh bid when a bill matures. Advance the clock to process pay dates and credit wallets."
        action={<AdvanceClock />}
      />

      <StatGrid>
        <StatCard label="Scheduled" value={String(summary.scheduledCount)} />
        <StatCard
          label="Processed"
          value={String(summary.processedCount)}
          tone="positive"
        />
        <StatCard
          label="Client credits"
          value={formatZMW(summary.clientCreditsNgwee)}
          hint="Net of withholding tax"
        />
        <StatCard
          label="WHT withheld"
          value={formatZMW(summary.whtWithheldNgwee)}
          tone={summary.whtWithheldNgwee > 0 ? "warning" : "neutral"}
        />
      </StatGrid>

      {autoRolls.length > 0 ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <RefreshCw size={16} className="text-brand-green" />
              T-bill auto-roll
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {autoRolls.map((roll) => (
              <div
                key={roll.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {roll.symbol} matures for {roll.clientName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reinvests {formatZMW(roll.netNgwee)} into{" "}
                    {roll.rolledIntoSymbol ?? "a fresh bill"} on{" "}
                    {formatDateZM(roll.payDate)}
                  </p>
                </div>
                <ToneBadge tone={statusTone(roll.status)}>
                  {roll.status === "PROCESSED" ? "Rolled" : "Scheduled"}
                </ToneBadge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Corporate action calendar</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Instrument</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Pay date</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">WHT</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell>
                    <ToneBadge tone="info">{TYPE_LABELS[action.type]}</ToneBadge>
                  </TableCell>
                  <TableCell className="font-medium">{action.symbol}</TableCell>
                  <TableCell>{action.clientName}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatDateZM(action.payDate)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatZMW(action.grossNgwee)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {action.whtNgwee > 0 ? formatZMW(action.whtNgwee) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatZMW(action.netNgwee)}
                  </TableCell>
                  <TableCell>
                    <ToneBadge tone={statusTone(action.status)}>
                      {action.status}
                    </ToneBadge>
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
