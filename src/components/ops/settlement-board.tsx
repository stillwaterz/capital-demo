"use client";

import { useMemo } from "react";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { useCustomerOrdersStore } from "@/lib/store/customer-orders";
import { customerOrderToTrade } from "@/lib/ops/customer-trades";
import { formatZMW, formatDateZM } from "@/lib/format";
import type { SettlementStatus, TradeState } from "@/lib/ops/types";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  PageHeading,
  StatCard,
  StatGrid,
  ToneBadge,
} from "@/components/ops/ops-kit";
import { AskAiButton } from "@/components/ops/ask-ai-button";

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

  return (
    <div className="space-y-6">
      <PageHeading
        title="Settlement"
        description="Trade lifecycle board, T+1 settlement batches with delivery versus payment legs, and the fail queue. Advance the clock to settle the open batch."
        action={<AdvanceClock />}
      />

      <StatGrid>
        <StatCard label="Settlement batches" value={String(summary.batchCount)} />
        <StatCard
          label="Pending to fund"
          value={formatZMW(summary.pendingFundingNgwee)}
          tone={summary.pendingFundingNgwee > 0 ? "warning" : "neutral"}
          hint="Net cash on open batches"
        />
        <StatCard
          label="Settled batches"
          value={String(summary.settledCount)}
          tone="positive"
        />
        <StatCard
          label="Fails"
          value={String(summary.failCount)}
          tone={summary.failCount > 0 ? "danger" : "positive"}
        />
      </StatGrid>

      <Tabs defaultValue="lifecycle">
        <TabsList>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="fails">Fail queue</TabsTrigger>
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
                        <Card key={trade.id} size="sm">
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
          {batches.map((batch) => {
            const legs = settlementLegs(batch);
            const batchTrades = tradesInBatch(batch.id, businessDate, extraTrades);
            return (
              <Card key={batch.id}>
                <CardHeader className="border-b">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>
                      Settlement {formatDateZM(batch.settlementDate)}
                    </CardTitle>
                    <ToneBadge tone={statusTone(batch.status)}>
                      {batch.status}
                    </ToneBadge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
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
                        <TableRow key={trade.id}>
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
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="fails" className="pt-4">
          {fails.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No settlement fails on {formatDateZM(businessDate)}.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-destructive" />
                  Fail queue
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
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
                    {fails.map((fail) => (
                      <TableRow key={fail.tradeId}>
                        <TableCell className="font-medium">
                          {fail.tradeId}
                        </TableCell>
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
                        <TableCell className="text-right align-top">
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
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
