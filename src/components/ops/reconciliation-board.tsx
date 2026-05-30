"use client";

import { useOpsClockStore } from "@/lib/store/ops-clock";
import { formatZMW } from "@/lib/format";
import type { BreakStatus, ReconBreak } from "@/lib/ops/types";
import {
  cashRecon,
  floatRecon,
  listReconBreaks,
  positionRecon,
  reconSummary,
} from "@/lib/ops/reconciliation";
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
import { formatDateZM } from "@/lib/format";
import type { IsoDate } from "@/lib/ops/types";

function statusTone(status: BreakStatus) {
  switch (status) {
    case "RESOLVED":
      return "positive" as const;
    case "WRITTEN_OFF":
      return "neutral" as const;
    case "INVESTIGATING":
      return "warning" as const;
    default:
      return "danger" as const;
  }
}

function units(value: number): string {
  return `${value.toLocaleString("en-US")} units`;
}

function BreakRow({
  brk,
  businessDate,
  withAssist = false,
}: {
  brk: ReconBreak;
  businessDate?: IsoDate;
  withAssist?: boolean;
}) {
  const isPosition = brk.type === "POSITION";
  const fmt = isPosition ? units : formatZMW;
  return (
    <TableRow>
      <TableCell className="font-medium">{brk.label}</TableCell>
      <TableCell>
        <ToneBadge tone="info">{brk.type}</ToneBadge>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {fmt(brk.internalValue)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {fmt(brk.externalValue)}
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {fmt(brk.differenceValue)}
      </TableCell>
      <TableCell>
        <ToneBadge tone={statusTone(brk.status)}>{brk.status}</ToneBadge>
      </TableCell>
      <TableCell className="text-muted-foreground">{brk.cause}</TableCell>
      {withAssist ? (
        <TableCell className="text-right align-top">
          <AskAiButton
            task="recon-break"
            proposalKind="RELEASE_BREAK"
            targetRef={brk.id}
            fallbackSummary={`Release the ${brk.type.toLowerCase()} break "${brk.label}" once the offset is posted.`}
            context={{
              subsystem: "Reconciliation",
              businessDate: businessDate ? formatDateZM(businessDate) : "",
              facts: { break: brk },
            }}
          />
        </TableCell>
      ) : null}
    </TableRow>
  );
}

export function ReconciliationBoard() {
  const businessDate = useOpsClockStore((s) => s.businessDate);
  const summary = reconSummary(businessDate);
  const breaks = listReconBreaks(businessDate);
  const cash = cashRecon(businessDate);
  const position = positionRecon(businessDate);
  const float = floatRecon();

  return (
    <div className="space-y-6">
      <PageHeading
        title="Reconciliation"
        description="Cash, position and float reconciliations against bank, CSD and rail statements, with a break queue tied to live settlement fails."
        action={<AdvanceClock />}
      />

      <StatGrid>
        <StatCard
          label="Open breaks"
          value={String(summary.openBreaks)}
          tone={summary.openBreaks > 0 ? "danger" : "positive"}
        />
        <StatCard
          label="Investigating"
          value={String(summary.investigatingBreaks)}
          tone={summary.investigatingBreaks > 0 ? "warning" : "neutral"}
        />
        <StatCard label="Cash breaks" value={String(summary.cashBreaks)} />
        <StatCard
          label="Position breaks"
          value={String(summary.positionBreaks)}
        />
      </StatGrid>

      <Tabs defaultValue="breaks">
        <TabsList>
          <TabsTrigger value="breaks">All breaks</TabsTrigger>
          <TabsTrigger value="cash">Cash</TabsTrigger>
          <TabsTrigger value="position">Position</TabsTrigger>
          <TabsTrigger value="float">Float</TabsTrigger>
        </TabsList>

        <TabsContent value="breaks" className="pt-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Break queue</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {breaks.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No reconciliation breaks.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Break</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Internal</TableHead>
                      <TableHead className="text-right">External</TableHead>
                      <TableHead className="text-right">Difference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cause</TableHead>
                      <TableHead className="text-right">Assist</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {breaks.map((brk) => (
                      <BreakRow
                        key={brk.id}
                        brk={brk}
                        businessDate={businessDate}
                        withAssist
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash" className="space-y-4 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Ledger cash" value={formatZMW(cash.internalNgwee)} />
            <StatCard
              label="Bank statement"
              value={formatZMW(cash.externalNgwee)}
            />
          </div>
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Cash breaks</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {cash.breaks.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Cash ties to the settlement bank.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Break</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Internal</TableHead>
                      <TableHead className="text-right">External</TableHead>
                      <TableHead className="text-right">Difference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cause</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cash.breaks.map((brk) => (
                      <BreakRow key={brk.id} brk={brk} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="position" className="pt-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>CSD versus internal positions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instrument</TableHead>
                    <TableHead className="text-right">Internal</TableHead>
                    <TableHead className="text-right">CSD</TableHead>
                    <TableHead className="text-right">Match</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {position.rows.map((row, index) => (
                    <TableRow key={`${row.symbol}-${index}`}>
                      <TableCell className="font-medium">{row.symbol}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.internalUnits.toLocaleString("en-US")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.externalUnits.toLocaleString("en-US")}
                      </TableCell>
                      <TableCell className="text-right">
                        <ToneBadge tone={row.matched ? "positive" : "danger"}>
                          {row.matched ? "Matched" : "Break"}
                        </ToneBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="float" className="pt-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Float versus rail statements</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rail</TableHead>
                    <TableHead className="text-right">Internal</TableHead>
                    <TableHead className="text-right">Statement</TableHead>
                    <TableHead className="text-right">Match</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {float.rows.map((row) => (
                    <TableRow key={row.rail}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatZMW(row.internalNgwee)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatZMW(row.externalNgwee)}
                      </TableCell>
                      <TableCell className="text-right">
                        <ToneBadge tone={row.matched ? "positive" : "warning"}>
                          {row.matched ? "Matched" : "Break"}
                        </ToneBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
