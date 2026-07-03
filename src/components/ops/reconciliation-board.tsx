"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Scale,
  Search,
  Wallet,
} from "lucide-react";
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
  OpsPage,
  PageHeading,
  SectionCard,
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
    <OpsPage>
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
          icon={Scale}
        />
        <StatCard
          label="Investigating"
          value={String(summary.investigatingBreaks)}
          tone={summary.investigatingBreaks > 0 ? "warning" : "neutral"}
          icon={Search}
        />
        <StatCard
          label="Cash breaks"
          value={String(summary.cashBreaks)}
          icon={Wallet}
        />
        <StatCard
          label="Position breaks"
          value={String(summary.positionBreaks)}
          icon={AlertTriangle}
        />
      </StatGrid>

      <Tabs defaultValue="breaks">
        <TabsList>
          <TabsTrigger value="breaks">
            All breaks
            {breaks.length > 0 ? (
              <span className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                {breaks.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="cash">Cash</TabsTrigger>
          <TabsTrigger value="position">Position</TabsTrigger>
          <TabsTrigger value="float">Float</TabsTrigger>
        </TabsList>

        <TabsContent value="breaks" className="pt-4">
          <SectionCard
            title="Break queue"
            icon={Scale}
            description="Internal ledger versus external statements. Open breaks block clean close."
            contentClassName={breaks.length === 0 ? undefined : "pt-0"}
          >
            {breaks.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="All reconciled"
                description="No reconciliation breaks on this business date."
              />
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
          </SectionCard>
        </TabsContent>

        <TabsContent value="cash" className="space-y-4 pt-4">
          <StatGrid>
            <StatCard label="Ledger cash" value={formatZMW(cash.internalNgwee)} icon={Wallet} />
            <StatCard
              label="Bank statement"
              value={formatZMW(cash.externalNgwee)}
              icon={Scale}
            />
          </StatGrid>
          <SectionCard
            title="Cash breaks"
            icon={Wallet}
            contentClassName={cash.breaks.length === 0 ? undefined : "pt-0"}
          >
            {cash.breaks.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Cash ties"
                description="Ledger cash matches the settlement bank statement."
              />
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
          </SectionCard>
        </TabsContent>

        <TabsContent value="position" className="pt-4">
          <SectionCard title="CSD versus internal positions" icon={Scale} contentClassName="pt-0">
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
          </SectionCard>
        </TabsContent>

        <TabsContent value="float" className="pt-4">
          <SectionCard title="Float versus rail statements" icon={Wallet} contentClassName="pt-0">
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
          </SectionCard>
        </TabsContent>
      </Tabs>
    </OpsPage>
  );
}
