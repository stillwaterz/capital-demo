"use client";

import { Calendar, Coins, FileText, Receipt } from "lucide-react";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { formatZMW, formatDateZM } from "@/lib/format";
import type { RemittanceStatus } from "@/lib/ops/types";
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

  return (
    <OpsPage>
      <PageHeading
        title="Fees and Tax"
        description="The commission schedule, brokerage, levy and CSD fee runs from settled trades, and the 15% withholding tax register for remittance to ZRA."
        action={<AdvanceClock />}
      />

      <StatGrid>
        <StatCard label="Fee runs" value={String(summary.feeRunCount)} icon={Receipt} />
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
        />
        <StatCard
          label="Open periods"
          value={String(summary.remittanceCount)}
          icon={Calendar}
        />
      </StatGrid>

      <Tabs defaultValue="runs">
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
                    <TableRow key={run.id}>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {remittances.map((row) => (
                    <TableRow key={row.id}>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </OpsPage>
  );
}
