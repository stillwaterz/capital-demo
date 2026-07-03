"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Layers,
  Package,
  Wallet,
} from "lucide-react";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { useCustomerOrdersStore } from "@/lib/store/customer-orders";
import { customerOrderToTrade } from "@/lib/ops/customer-trades";
import { formatZMW, formatDateZM } from "@/lib/format";
import type { SettlementStatus, Trade, TradeState } from "@/lib/ops/types";
import {
  groupTradesByState,
  TRADE_STATE_ORDER,
} from "@/lib/ops/trades";
import {
  listSettlementBatches,
  listSettlementFails,
  settlementLegs,
  settlementSummary,
  tradesInBatch,
} from "@/lib/ops/settlement";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  EmptyState,
  OpsCountBadge,
  OpsPage,
  PageHeading,
  SectionCard,
  StatCard,
  StatGrid,
  ToneBadge,
} from "@/components/ops/ops-kit";
import { AskAiButton } from "@/components/ops/ask-ai-button";
import {
  OpsDetailSheet,
  type DetailField,
} from "@/components/ops/ops-detail-sheet";

const STATE_LABELS: Record<TradeState, string> = {
  NEW: "New",
  EXECUTED: "Executed",
  CONFIRMED: "Confirmed",
  CLEARING: "Clearing",
  SETTLED: "Settled",
  FAILED: "Failed",
};

function stateTone(state: TradeState) {
  switch (state) {
    case "SETTLED":
      return "positive" as const;
    case "FAILED":
      return "danger" as const;
    case "CLEARING":
      return "warning" as const;
    case "NEW":
      return "neutral" as const;
    default:
      return "info" as const;
  }
}

function statusTone(status: SettlementStatus) {
  switch (status) {
    case "SETTLED":
      return "positive" as const;
    case "FAILED":
      return "danger" as const;
    case "PARTIAL":
      return "warning" as const;
    default:
      return "warning" as const;
  }
}

export function SettlementBoard() {
  const businessDate = useOpsClockStore((s) => s.businessDate);
  const orders = useCustomerOrdersStore((s) => s.orders);
  const extraTrades = useMemo(
    () => orders.map((o) => customerOrderToTrade(o, businessDate)),
    [orders, businessDate]
  );
  const grouped = groupTradesByState(businessDate, extraTrades);
  const batches = listSettlementBatches(businessDate, extraTrades);
  const fails = listSettlementFails(businessDate, extraTrades);
  const summary = settlementSummary(businessDate, extraTrades);

  const [tab, setTab] = useState("lifecycle");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const tradesById = useMemo(() => {
    const map = new Map<string, Trade>();
    for (const state of TRADE_STATE_ORDER) {
      for (const trade of grouped[state]) {
        map.set(trade.id, trade);
      }
    }
    return map;
  }, [grouped]);

  const detailFields: DetailField[] = selectedTrade
    ? [
        { label: "Side", value: selectedTrade.side },
        { label: "Client", value: selectedTrade.clientName },
        {
          label: "Quantity",
          value: selectedTrade.quantity.toLocaleString("en-US"),
          mono: true,
        },
        {
          label: "Price",
          value: formatZMW(selectedTrade.priceNgwee),
          mono: true,
        },
        {
          label: "Net consideration",
          value: formatZMW(selectedTrade.netNgwee),
          mono: true,
        },
        { label: "Status", value: STATE_LABELS[selectedTrade.state] },
        ...(selectedTrade.failReason
          ? [
              {
                label: "Fail reason",
                value: selectedTrade.failReason,
              } satisfies DetailField,
            ]
          : []),
      ]
    : [];

  return (
    <OpsPage>
      <PageHeading
        title="Settlement"
        description="Trade lifecycle board, T+1 settlement batches with delivery versus payment legs, and the fail queue. Advance the clock to settle the open batch."
        action={<AdvanceClock />}
      />

      <StatGrid>
        <StatCard
          label="Settlement batches"
          value={String(summary.batchCount)}
          icon={Package}
          onClick={() => setTab("batches")}
        />
        <StatCard
          label="Pending to fund"
          value={formatZMW(summary.pendingFundingNgwee)}
          tone={summary.pendingFundingNgwee > 0 ? "warning" : "neutral"}
          hint="Net cash on open batches"
          icon={Wallet}
          onClick={() => setTab("batches")}
        />
        <StatCard
          label="Settled batches"
          value={String(summary.settledCount)}
          tone="positive"
          icon={CheckCircle2}
          onClick={() => setTab("batches")}
        />
        <StatCard
          label="Fails"
          value={String(summary.failCount)}
          tone={summary.failCount > 0 ? "danger" : "positive"}
          icon={AlertTriangle}
          onClick={() => setTab("fails")}
        />
      </StatGrid>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="fails">
            Fail queue
            <OpsCountBadge count={fails.length} className="ml-1.5" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lifecycle" className="pt-4">
          <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {TRADE_STATE_ORDER.map((state) => {
              const trades = grouped[state];
              return (
                <div key={state} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <ToneBadge tone={stateTone(state)}>
                      {STATE_LABELS[state]}
                    </ToneBadge>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {trades.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {trades.length === 0 ? (
                      <p className="rounded-lg border border-dashed px-2 py-3 text-center text-xs text-muted-foreground">
                        None
                      </p>
                    ) : (
                      trades.map((trade) => (
                        <Card
                          key={trade.id}
                          size="sm"
                          onClick={() => setSelectedTrade(trade)}
                          className="cursor-pointer transition-colors hover:bg-muted/40 hover:ring-foreground/20"
                        >
                          <CardContent className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{trade.symbol}</span>
                              <div className="flex items-center gap-1">
                                {trade.id.startsWith("CUST-") ? (
                                  <ToneBadge tone="brand">App</ToneBadge>
                                ) : null}
                                <ToneBadge
                                  tone={trade.side === "BUY" ? "info" : "neutral"}
                                >
                                  {trade.side}
                                </ToneBadge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {trade.clientName}
                            </p>
                            <p className="text-xs tabular-nums">
                              {trade.quantity.toLocaleString("en-US")} @{" "}
                              {formatZMW(trade.priceNgwee)}
                            </p>
                            <p className="text-sm font-medium tabular-nums">
                              {formatZMW(trade.netNgwee)}
                            </p>
                            {trade.failReason ? (
                              <p className="text-xs text-destructive">
                                {trade.failReason}
                              </p>
                            ) : null}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4 pt-4">
          {batches.length === 0 ? (
            <SectionCard title="Settlement batches" icon={Layers}>
              <EmptyState
                icon={Package}
                title="No batches yet"
                description="Advance the clock or confirm trades to create settlement batches."
              />
            </SectionCard>
          ) : (
            batches.map((batch) => {
              const legs = settlementLegs(batch);
              const batchTrades = tradesInBatch(batch.id, businessDate, extraTrades);
              return (
                <SectionCard
                  key={batch.id}
                  title={`Settlement ${formatDateZM(batch.settlementDate)}`}
                  icon={Package}
                  action={
                    <ToneBadge tone={statusTone(batch.status)}>
                      {batch.status}
                    </ToneBadge>
                  }
                >
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {legs.map((leg) => (
                        <div
                          key={leg.kind}
                          className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            {leg.direction === "BUY" ? (
                              <ArrowUpRight size={16} className="text-amber-600" />
                            ) : (
                              <ArrowDownLeft
                                size={16}
                                className="text-emerald-600"
                              />
                            )}
                            <span className="font-medium">{leg.label}</span>
                          </div>
                          <span className="text-sm font-medium tabular-nums">
                            {leg.kind === "CASH"
                              ? formatZMW(leg.value)
                              : `${leg.value.toLocaleString("en-US")} units`}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Trade</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Instrument</TableHead>
                          <TableHead className="text-right">Net</TableHead>
                          <TableHead className="text-right">State</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchTrades.map((trade) => (
                          <TableRow
                            key={trade.id}
                            onClick={() => setSelectedTrade(trade)}
                            className="cursor-pointer"
                          >
                            <TableCell className="font-medium">{trade.id}</TableCell>
                            <TableCell>{trade.clientName}</TableCell>
                            <TableCell>
                              {trade.side} {trade.symbol}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatZMW(trade.netNgwee)}
                            </TableCell>
                            <TableCell className="text-right">
                              <ToneBadge tone={stateTone(trade.state)}>
                                {STATE_LABELS[trade.state]}
                              </ToneBadge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </SectionCard>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="fails" className="pt-4">
          {fails.length === 0 ? (
            <SectionCard title="Fail queue" icon={CheckCircle2}>
              <EmptyState
                icon={CheckCircle2}
                title="No settlement fails"
                description={`Nothing failed on ${formatDateZM(businessDate)}.`}
              />
            </SectionCard>
          ) : (
            <SectionCard
              title="Fail queue"
              icon={AlertTriangle}
              iconClassName="text-destructive"
              description="Trades that did not settle. Use AI assist to draft a remediation proposal."
              contentClassName="pt-0"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trade</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Instrument</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Assist</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fails.map((fail) => {
                    const failTrade = tradesById.get(fail.tradeId);
                    return (
                    <TableRow
                      key={fail.tradeId}
                      onClick={
                        failTrade
                          ? () => setSelectedTrade(failTrade)
                          : undefined
                      }
                      className={failTrade ? "cursor-pointer" : undefined}
                    >
                      <TableCell className="font-medium">{fail.tradeId}</TableCell>
                      <TableCell>{fail.clientName}</TableCell>
                      <TableCell>
                        {fail.side} {fail.symbol}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatZMW(fail.netNgwee)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {fail.reason}
                      </TableCell>
                      <TableCell
                        className="text-right align-top"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AskAiButton
                          task="settlement-fail"
                          proposalKind="SETTLE_FAIL"
                          targetRef={fail.tradeId}
                          fallbackSummary={`Bridge the cash leg on trade ${fail.tradeId} from treasury float so the batch settles.`}
                          context={{
                            subsystem: "Settlement",
                            businessDate: formatDateZM(businessDate),
                            facts: { fail, summary },
                          }}
                        />
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </SectionCard>
          )}
        </TabsContent>
      </Tabs>

      <OpsDetailSheet
        open={selectedTrade !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTrade(null);
        }}
        title={selectedTrade ? selectedTrade.symbol : ""}
        subtitle={selectedTrade ? `Trade ${selectedTrade.id}` : undefined}
        badge={
          selectedTrade ? (
            <ToneBadge tone={stateTone(selectedTrade.state)}>
              {STATE_LABELS[selectedTrade.state]}
            </ToneBadge>
          ) : undefined
        }
        fields={detailFields}
      />
    </OpsPage>
  );
}
