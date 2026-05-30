"use client";

import { useOpsClockStore } from "@/lib/store/ops-clock";
import { formatZMW, formatDateZM } from "@/lib/format";
import type { RemittanceStatus } from "@/lib/ops/types";
import {
  COMMISSION_SCHEDULE,
  feesSummary,
  listFeeRuns,
  listWhtRemittances,
} from "@/lib/ops/fees";
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
    <div className="space-y-6">
      <PageHeading
        title="Fees and Tax"
        description="The commission schedule, brokerage, levy and CSD fee runs from settled trades, and the 15% withholding tax register for remittance to ZRA."
        action={<AdvanceClock />}
      />

      <StatGrid>
        <StatCard label="Fee runs" value={String(summary.feeRunCount)} />
        <StatCard
          label="Fees captured"
          value={formatZMW(summary.totalFeesNgwee)}
          tone="positive"
        />
        <StatCard
          label="WHT payable"
          value={formatZMW(summary.whtPayableNgwee)}
          tone={summary.whtPayableNgwee > 0 ? "warning" : "neutral"}
          hint="Owed to ZRA"
        />
        <StatCard
          label="Open periods"
          value={String(summary.remittanceCount)}
        />
      </StatGrid>

      <Tabs defaultValue="runs">
        <TabsList>
          <TabsTrigger value="runs">Fee runs</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="wht">WHT register</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="pt-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Fee runs</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {feeRuns.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No fee runs yet. Settle trades to capture fees.
                </p>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="pt-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Commission schedule</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wht" className="pt-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>ZRA withholding tax register</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {remittances.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No withholding tax captured yet.
                </p>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
