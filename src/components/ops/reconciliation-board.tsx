"use client";

import { useState } from "react";
import type { ReactNode } from "react";
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
  onSelect,
}: {
  brk: ReconBreak;
  businessDate?: IsoDate;
  withAssist?: boolean;
  onSelect: (brk: ReconBreak) => void;
}) {
  const isPosition = brk.type === "POSITION";
  const fmt = isPosition ? units : formatZMW;
  return (
    <TableRow
      onClick={() => onSelect(brk)}
      className="cursor-pointer hover:bg-muted/50"
    >
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
        <TableCell
          className="text-right align-top"
          onClick={(e) => e.stopPropagation()}
        >
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

type LineDetail = {
  title: string;
  subtitle: string;
  badge: ReactNode;
  fields: readonly DetailField[];
};

export function ReconciliationBoard() {
  const businessDate = useOpsClockStore((s) => s.businessDate);
  const summary = reconSummary(businessDate);
  const breaks = listReconBreaks(businessDate);
  const cash = cashRecon(businessDate);
  const position = positionRecon(businessDate);
  const float = floatRecon();

  const [tab, setTab] = useState("breaks");
  const [selectedBreak, setSelectedBreak] = useState<ReconBreak | null>(null);
  const [selectedLine, setSelectedLine] = useState<LineDetail | null>(null);

  const breakIsPosition = selectedBreak?.type === "POSITION";
  const breakFmt = breakIsPosition ? units : formatZMW;

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
          onClick={() => setTab("breaks")}
        />
        <StatCard
          label="Investigating"
          value={String(summary.investigatingBreaks)}
          tone={summary.investigatingBreaks > 0 ? "warning" : "neutral"}
          icon={Search}
          onClick={() => setTab("breaks")}
        />
        <StatCard
          label="Cash breaks"
          value={String(summary.cashBreaks)}
          icon={Wallet}
          onClick={() => setTab("cash")}
        />
        <StatCard
          label="Position breaks"
          value={String(summary.positionBreaks)}
          icon={AlertTriangle}
          onClick={() => setTab("position")}
        />
      </StatGrid>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="breaks">
            All breaks
            <OpsCountBadge count={breaks.length} className="ml-1.5" />
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
                      onSelect={setSelectedBreak}
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
                    <BreakRow
                      key={brk.id}
                      brk={brk}
                      onSelect={setSelectedBreak}
                    />
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
                  <TableRow
                    key={`${row.symbol}-${index}`}
                    onClick={() =>
                      setSelectedLine({
                        title: row.symbol,
                        subtitle: "CSD register versus internal stock record",
                        badge: (
                          <ToneBadge tone={row.matched ? "positive" : "danger"}>
                            {row.matched ? "Matched" : "Break"}
                          </ToneBadge>
                        ),
                        fields: [
                          { label: "Instrument", value: row.symbol },
                          {
                            label: "Internal units",
                            value: units(row.internalUnits),
                            mono: true,
                          },
                          {
                            label: "CSD units",
                            value: units(row.externalUnits),
                            mono: true,
                          },
                          {
                            label: "Difference",
                            value: units(row.internalUnits - row.externalUnits),
                            mono: true,
                          },
                        ],
                      })
                    }
                    className="cursor-pointer hover:bg-muted/50"
                  >
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
                  <TableRow
                    key={row.rail}
                    onClick={() =>
                      setSelectedLine({
                        title: row.name,
                        subtitle: "Treasury float versus rail statement",
                        badge: (
                          <ToneBadge tone={row.matched ? "positive" : "warning"}>
                            {row.matched ? "Matched" : "Break"}
                          </ToneBadge>
                        ),
                        fields: [
                          { label: "Rail", value: row.name },
                          {
                            label: "Internal float",
                            value: formatZMW(row.internalNgwee),
                            mono: true,
                          },
                          {
                            label: "Statement",
                            value: formatZMW(row.externalNgwee),
                            mono: true,
                          },
                          {
                            label: "Difference",
                            value: formatZMW(row.internalNgwee - row.externalNgwee),
                            mono: true,
                          },
                        ],
                      })
                    }
                    className="cursor-pointer hover:bg-muted/50"
                  >
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

      <OpsDetailSheet
        open={selectedBreak !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedBreak(null);
        }}
        title={selectedBreak ? selectedBreak.label : ""}
        subtitle={
          selectedBreak
            ? "Internal ledger versus external statement figures for this break."
            : undefined
        }
        badge={
          selectedBreak ? (
            <ToneBadge tone={statusTone(selectedBreak.status)}>
              {selectedBreak.status}
            </ToneBadge>
          ) : undefined
        }
        fields={
          selectedBreak
            ? [
                { label: "Break", value: selectedBreak.id, mono: true },
                {
                  label: "Type",
                  value: (
                    <ToneBadge tone="info">{selectedBreak.type}</ToneBadge>
                  ),
                },
                { label: "Detail", value: selectedBreak.label },
                {
                  label: "Internal",
                  value: breakFmt(selectedBreak.internalValue),
                  mono: true,
                },
                {
                  label: "External",
                  value: breakFmt(selectedBreak.externalValue),
                  mono: true,
                },
                {
                  label: "Variance",
                  value: breakFmt(selectedBreak.differenceValue),
                  mono: true,
                },
                {
                  label: "Reason",
                  value: selectedBreak.cause ?? "Not recorded",
                },
              ]
            : []
        }
      />

      <OpsDetailSheet
        open={selectedLine !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLine(null);
        }}
        title={selectedLine ? selectedLine.title : ""}
        subtitle={selectedLine ? selectedLine.subtitle : undefined}
        badge={selectedLine ? selectedLine.badge : undefined}
        fields={selectedLine ? selectedLine.fields : []}
      />
    </OpsPage>
  );
}
