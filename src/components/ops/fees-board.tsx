"use client";

import { useState } from "react";
import { Calendar, Coins, FileText, Landmark, Receipt } from "lucide-react";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { formatZMW, formatDateZM } from "@/lib/format";
import type { FeeRun, RemittanceStatus, WhtRemittance } from "@/lib/ops/types";
import {
  COMMISSION_SCHEDULE,
  feesSummary,
  listFeeRuns,
  listWhtRemittances,
} from "@/lib/ops/fees";
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
import { OpsDetailSheet } from "@/components/ops/ops-detail-sheet";
import { ProposeActionButton } from "@/components/ops/propose-action-button";
import {
  EmptyState,
  OpsPage,
  PageHeading,
  SectionCard,
  StatCard,
  StatGrid,
  ToneBadge,
} from "@/components/ops/ops-kit";

function remittanceTone(status: RemittanceStatus) {
  switch (status) {
    case "REMITTED":
      return "positive" as const;
    case "OVERDUE":
      return "danger" as const;
    default:
      return "warning" as const;
  }
}

export function FeesBoard() {
  const businessDate = useOpsClockStore((s) => s.businessDate);
  const feeRuns = listFeeRuns(businessDate);
  const remittances = listWhtRemittances(businessDate);
  const summary = feesSummary(businessDate);

  const [tab, setTab] = useState("runs");
  const [selectedRun, setSelectedRun] = useState<FeeRun | null>(null);
  const [selectedRemittance, setSelectedRemittance] =
    useState<WhtRemittance | null>(null);

  return (
    <OpsPage>
      <PageHeading
        title="Fees and Tax"
        description="The commission schedule, brokerage, levy and CSD fee runs from settled trades, and the 15% withholding tax register for remittance to ZRA."
        action={<AdvanceClock />}
      />

      <StatGrid>
        <StatCard
          label="Fee runs"
          value={String(summary.feeRunCount)}
          icon={Receipt}
          onClick={() => setTab("runs")}
        />
        <StatCard
          label="Fees captured"
          value={formatZMW(summary.totalFeesNgwee)}
          tone="positive"
          icon={Coins}
        />
        <StatCard
          label="WHT payable"
          value={formatZMW(summary.whtPayableNgwee)}
          tone={summary.whtPayableNgwee > 0 ? "warning" : "neutral"}
          hint="Owed to ZRA"
          icon={FileText}
          onClick={() => setTab("wht")}
        />
        <StatCard
          label="Open periods"
          value={String(summary.remittanceCount)}
          icon={Calendar}
          onClick={() => setTab("wht")}
        />
      </StatGrid>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="runs">Fee runs</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="wht">WHT register</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="pt-4">
          <SectionCard title="Fee runs" icon={Receipt} contentClassName={feeRuns.length === 0 ? undefined : "pt-0"}>
            {feeRuns.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No fee runs yet"
                description="Settle trades to capture brokerage, levy and CSD fees."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Posted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeRuns.map((run) => (
                    <TableRow
                      key={run.id}
                      onClick={() => setSelectedRun(run)}
                      className="cursor-pointer"
                    >
                      <TableCell className="tabular-nums">
                        {formatDateZM(run.date)}
                      </TableCell>
                      <TableCell>
                        <ToneBadge tone="info">{run.type}</ToneBadge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {run.itemCount}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatZMW(run.totalNgwee)}
                      </TableCell>
                      <TableCell>
                        <ToneBadge
                          tone={run.postedToLedger ? "positive" : "warning"}
                        >
                          {run.postedToLedger ? "Posted" : "Pending"}
                        </ToneBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="schedule" className="pt-4">
          <SectionCard
            title="Commission schedule"
            icon={FileText}
            description="Published fee rates applied on every settled trade."
            contentClassName="pt-0"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee</TableHead>
                  <TableHead>Applies to</TableHead>
                  <TableHead>Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COMMISSION_SCHEDULE.map((row) => (
                  <TableRow key={`${row.feeType}-${row.assetClass}`}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.assetClass === "ALL" ? "All income" : row.assetClass}
                    </TableCell>
                    <TableCell>{row.rate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>

        <TabsContent value="wht" className="pt-4">
          <SectionCard
            title="ZRA withholding tax register"
            icon={FileText}
            description="15% WHT on dividends and coupons, remitted to ZRA by due date."
            contentClassName={remittances.length === 0 ? undefined : "pt-0"}
          >
            {remittances.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No withholding tax yet"
                description="Corporate actions and income events will populate the register."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {remittances.map((row) => (
                    <TableRow
                      key={row.id}
                      onClick={() => setSelectedRemittance(row)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-medium">{row.period}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatZMW(row.amountNgwee)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatDateZM(row.dueDate)}
                      </TableCell>
                      <TableCell>
                        <ToneBadge tone={remittanceTone(row.status)}>
                          {row.status}
                        </ToneBadge>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {row.status === "REMITTED" ? null : (
                          <ProposeActionButton
                            kind="REMIT_WHT"
                            summary={`Remit ${formatZMW(row.amountNgwee)} withholding tax for ${row.period} to ZRA`}
                            targetRef={row.id}
                            label="Remit to ZRA"
                            icon={Landmark}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      <OpsDetailSheet
        open={selectedRun !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRun(null);
        }}
        title={selectedRun ? selectedRun.type : ""}
        subtitle={
          selectedRun
            ? `Fee run for ${formatDateZM(selectedRun.date)}`
            : undefined
        }
        badge={
          selectedRun ? (
            <ToneBadge
              tone={selectedRun.postedToLedger ? "positive" : "warning"}
            >
              {selectedRun.postedToLedger ? "Posted" : "Pending"}
            </ToneBadge>
          ) : undefined
        }
        fields={
          selectedRun
            ? [
                { label: "Run id", value: selectedRun.id, mono: true },
                { label: "Date", value: formatDateZM(selectedRun.date) },
                { label: "Type", value: selectedRun.type },
                {
                  label: "Items",
                  value: String(selectedRun.itemCount),
                  mono: true,
                },
                {
                  label: "Total captured",
                  value: formatZMW(selectedRun.totalNgwee),
                  mono: true,
                },
                {
                  label: "Status",
                  value: selectedRun.postedToLedger ? "Posted" : "Pending",
                },
              ]
            : []
        }
      />

      <OpsDetailSheet
        open={selectedRemittance !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRemittance(null);
        }}
        title={selectedRemittance ? selectedRemittance.period : ""}
        subtitle={
          selectedRemittance
            ? "Withholding tax remittance to ZRA"
            : undefined
        }
        badge={
          selectedRemittance ? (
            <ToneBadge tone={remittanceTone(selectedRemittance.status)}>
              {selectedRemittance.status}
            </ToneBadge>
          ) : undefined
        }
        fields={
          selectedRemittance
            ? [
                { label: "Period", value: selectedRemittance.period },
                {
                  label: "Amount payable",
                  value: formatZMW(selectedRemittance.amountNgwee),
                  mono: true,
                },
                {
                  label: "Due date",
                  value: formatDateZM(selectedRemittance.dueDate),
                  mono: true,
                },
                { label: "Status", value: selectedRemittance.status },
              ]
            : []
        }
        footer={
          selectedRemittance && selectedRemittance.status !== "REMITTED" ? (
            <ProposeActionButton
              kind="REMIT_WHT"
              summary={`Remit ${formatZMW(selectedRemittance.amountNgwee)} withholding tax for ${selectedRemittance.period} to ZRA`}
              targetRef={selectedRemittance.id}
              label="Remit to ZRA"
              icon={Landmark}
              size="sm"
            />
          ) : undefined
        }
      />
    </OpsPage>
  );
}
