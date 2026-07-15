"use client";

import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Coins,
  Receipt,
} from "lucide-react";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { formatZMW, formatDateZM } from "@/lib/format";
import type {
  CorporateActionStatus,
  CorporateActionType,
} from "@/lib/ops/types";
import {
  corporateActionSummary,
  listCorporateActions,
  type CorporateActionView,
} from "@/lib/ops/corporate-actions";
import { OpsDetailSheet } from "@/components/ops/ops-detail-sheet";
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
  OpsPage,
  PageHeading,
  SectionCard,
  StatCard,
  StatGrid,
  ToneBadge,
} from "@/components/ops/ops-kit";

const TYPE_LABELS: Record<CorporateActionType, string> = {
  DIVIDEND: "Dividend",
  COUPON: "Coupon",
  MATURITY: "Maturity",
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
  const summary = corporateActionSummary(businessDate);
  const [selectedAction, setSelectedAction] =
    useState<CorporateActionView | null>(null);

  return (
    <OpsPage>
      <PageHeading
        title="Corporate Actions"
        description="Dividend runs and bond coupons. Advance the clock to process pay dates and credit wallets."
        action={<AdvanceClock />}
      />

      <StatGrid>
        <StatCard
          label="Scheduled"
          value={String(summary.scheduledCount)}
          icon={CalendarClock}
        />
        <StatCard
          label="Processed"
          value={String(summary.processedCount)}
          tone="positive"
          icon={CheckCircle2}
        />
        <StatCard
          label="Client credits"
          value={formatZMW(summary.clientCreditsNgwee)}
          hint="Net of withholding tax"
          icon={Coins}
        />
        <StatCard
          label="WHT withheld"
          value={formatZMW(summary.whtWithheldNgwee)}
          tone={summary.whtWithheldNgwee > 0 ? "warning" : "neutral"}
          icon={Receipt}
        />
      </StatGrid>

      <SectionCard
        title="Corporate action calendar"
        icon={CalendarClock}
        contentClassName="pt-0"
      >
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
              <TableRow
                key={action.id}
                onClick={() => setSelectedAction(action)}
                className="cursor-pointer"
              >
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
      </SectionCard>

      <OpsDetailSheet
        open={selectedAction !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedAction(null);
        }}
        title={selectedAction ? selectedAction.symbol : ""}
        subtitle={
          selectedAction
            ? `${TYPE_LABELS[selectedAction.type]} for ${selectedAction.clientName}`
            : undefined
        }
        badge={
          selectedAction ? (
            <ToneBadge tone={statusTone(selectedAction.status)}>
              {selectedAction.status}
            </ToneBadge>
          ) : undefined
        }
        fields={
          selectedAction
            ? [
                { label: "Type", value: TYPE_LABELS[selectedAction.type] },
                { label: "Instrument", value: selectedAction.symbol },
                { label: "Client", value: selectedAction.clientName },
                {
                  label: "Ex date",
                  value: formatDateZM(selectedAction.exDate),
                  mono: true,
                },
                {
                  label: "Pay date",
                  value: formatDateZM(selectedAction.payDate),
                  mono: true,
                },
                {
                  label: "Gross",
                  value: formatZMW(selectedAction.grossNgwee),
                  mono: true,
                },
                {
                  label: "WHT withheld",
                  value:
                    selectedAction.whtNgwee > 0
                      ? formatZMW(selectedAction.whtNgwee)
                      : "-",
                  mono: true,
                },
                {
                  label: "Client credit",
                  value: formatZMW(selectedAction.netNgwee),
                  mono: true,
                },
                ...(selectedAction.rolledIntoSymbol
                  ? [
                      {
                        label: "Rolls into",
                        value: selectedAction.rolledIntoSymbol,
                      },
                    ]
                  : []),
              ]
            : []
        }
      />
    </OpsPage>
  );
}
