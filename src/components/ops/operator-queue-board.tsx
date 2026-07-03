"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading, StatCard, StatGrid, ToneBadge } from "@/components/ops/ops-kit";
import { formatZMW, formatDateZM } from "@/lib/format";
import { useCustomerOrdersStore } from "@/lib/store/customer-orders";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { netIntoBlocks, blockConsiderationNgwee, type OrderBlock } from "@/lib/orders/blocks";
import { computeSettlementDate } from "@/lib/settlement/engine";

type BlockStage = "staged" | "working" | "filled";

/** Reconcile the ATS confirmation to the staged ticket before notes are issued. */
function isConfirmationMatched(block: OrderBlock, confirmedQty: number): boolean {
  return confirmedQty === block.aggregateQty;
}

function StageBadge({ stage }: { stage: BlockStage }) {
  if (stage === "filled") return <ToneBadge tone="positive">Filled</ToneBadge>;
  if (stage === "working") return <ToneBadge tone="warning">Working in ATS</ToneBadge>;
  return <ToneBadge tone="info">Staged</ToneBadge>;
}

export function OperatorQueueBoard() {
  const orders = useCustomerOrdersStore((s) => s.orders);
  const businessDate = useOpsClockStore((s) => s.businessDate);
  const [stages, setStages] = useState<Record<string, BlockStage>>({});

  const blocks = netIntoBlocks(
    orders.map((o) => ({
      id: o.id,
      symbol: o.symbol,
      side: o.side,
      quantity: o.quantity,
      priceNgwee: o.priceNgwee,
      clientName: o.clientName,
    }))
  );

  const stageOf = (id: string): BlockStage => stages[id] ?? "staged";
  const totalConsideration = blocks.reduce(
    (sum, b) => sum + blockConsiderationNgwee(b),
    0
  );
  const filledCount = blocks.filter((b) => stageOf(b.id) === "filled").length;

  function release(id: string) {
    setStages((prev) => ({ ...prev, [id]: "working" }));
  }

  function confirmFill(block: OrderBlock) {
    // The ATS confirms the released quantity. Reconcile before marking filled.
    if (!isConfirmationMatched(block, block.aggregateQty)) return;
    setStages((prev) => ({ ...prev, [block.id]: "filled" }));
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Operator queue"
        description="Retail orders netted into blocks for the LuSE session. Release a block into the ATS, then confirm the fill. Each client is allocated back at the block average price."
      />

      <StatGrid>
        <StatCard label="Staged orders" value={String(orders.length)} />
        <StatCard label="Blocks" value={String(blocks.length)} tone="brand" />
        <StatCard label="Filled blocks" value={String(filledCount)} tone="positive" />
        <StatCard
          label="Consideration"
          value={formatZMW(totalConsideration)}
        />
      </StatGrid>

      {blocks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No orders staged. Place an order in the customer app to see it netted
            into a block here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {blocks.map((block) => {
            const stage = stageOf(block.id);
            const settlementDate = computeSettlementDate(businessDate);
            return (
              <Card key={block.id}>
                <CardContent className="space-y-4 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-semibold">
                        {block.symbol}
                      </span>
                      <ToneBadge tone={block.side === "BUY" ? "brand" : "danger"}>
                        {block.side}
                      </ToneBadge>
                      <StageBadge stage={stage} />
                    </div>
                    <div className="flex gap-2">
                      {stage === "staged" && (
                        <Button size="sm" onClick={() => release(block.id)}>
                          Release into ATS
                        </Button>
                      )}
                      {stage === "working" && (
                        <Button size="sm" onClick={() => confirmFill(block)}>
                          Confirm ATS fill
                        </Button>
                      )}
                      {stage === "filled" && (
                        <ToneBadge tone="positive">Reconciled</ToneBadge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Aggregate</p>
                      <p className="tabular-nums">
                        {block.aggregateQty.toLocaleString()} shares
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg fill price</p>
                      <p className="tabular-nums">
                        {formatZMW(block.avgFillPriceNgwee)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Consideration</p>
                      <p className="tabular-nums">
                        {formatZMW(blockConsiderationNgwee(block))}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Settles</p>
                      <p>{formatDateZM(settlementDate)}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border">
                    <div className="grid grid-cols-3 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                      <span>Client</span>
                      <span className="text-right">Shares</span>
                      <span className="text-right">Allocated at avg</span>
                    </div>
                    {block.allocations.map((alloc) => (
                      <div
                        key={alloc.orderId}
                        className="grid grid-cols-3 gap-2 border-t border-border px-3 py-2 text-sm"
                      >
                        <span>{alloc.clientName}</span>
                        <span className="text-right tabular-nums">
                          {alloc.quantity.toLocaleString()}
                        </span>
                        <span className="text-right tabular-nums">
                          {formatZMW(alloc.considerationNgwee)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
