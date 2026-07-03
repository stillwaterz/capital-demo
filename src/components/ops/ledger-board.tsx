"use client";

import {
  BookOpen,
  CheckCircle2,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { formatZMW, formatDateZM } from "@/lib/format";
import {
  clientMoneySegregation,
  clientSubLedger,
  generateJournalEntries,
  ledgerSummary,
  trialBalance,
  trialBalanceTotals,
} from "@/lib/ops/ledger";
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
  OpsPage,
  PageHeading,
  SectionCard,
  StatCard,
  StatGrid,
  ToneBadge,
} from "@/components/ops/ops-kit";

export function LedgerBoard() {
  const businessDate = useOpsClockStore((s) => s.businessDate);
  const entries = generateJournalEntries(businessDate);
  const rows = trialBalance(businessDate);
  const totals = trialBalanceTotals(businessDate);
  const segregation = clientMoneySegregation(businessDate);
  const subLedger = clientSubLedger(businessDate);
  const summary = ledgerSummary(businessDate);

  return (
    <OpsPage>
      <PageHeading
        title="Ledger"
        description="Double-entry journal from settled trades and corporate actions, the trial balance proving debits equal credits, client-money segregation and the per-client sub-ledger."
        action={<AdvanceClock />}
      />

      <StatGrid>
        <StatCard
          label="Journal entries"
          value={String(summary.entryCount)}
          icon={BookOpen}
        />
        <StatCard
          label="Client money"
          value={formatZMW(summary.clientMoneyNgwee)}
          hint="Liability owed to clients"
          icon={Users}
        />
        <StatCard
          label="Fees income"
          value={formatZMW(summary.feesIncomeNgwee)}
          tone="positive"
          icon={TrendingUp}
        />
        <StatCard
          label="WHT payable"
          value={formatZMW(summary.whtPayableNgwee)}
          tone={summary.whtPayableNgwee > 0 ? "warning" : "neutral"}
          icon={Receipt}
        />
      </StatGrid>

      <Tabs defaultValue="journal">
        <TabsList>
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="trial">Trial balance</TabsTrigger>
          <TabsTrigger value="segregation">Segregation</TabsTrigger>
          <TabsTrigger value="subledger">Sub-ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="space-y-3 pt-4">
          {entries.length === 0 ? (
            <SectionCard title="Journal" icon={BookOpen}>
              <EmptyState
                icon={BookOpen}
                title="No entries yet"
                description="Settle trades or process corporate actions to post journal entries."
              />
            </SectionCard>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id} size="sm">
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{entry.memo}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatDateZM(entry.date)}
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entry.lines.map((line, index) => (
                        <TableRow key={`${entry.id}-${index}`}>
                          <TableCell className="font-medium">
                            {line.accountId}
                            {line.clientId ? (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({line.clientId})
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {line.debitNgwee > 0 ? formatZMW(line.debitNgwee) : "-"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {line.creditNgwee > 0
                              ? formatZMW(line.creditNgwee)
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="trial" className="pt-4">
          <SectionCard
            title="Trial balance"
            icon={BookOpen}
            action={
              totals.balanced ? (
                <ToneBadge tone="positive">
                  <CheckCircle2 className="mr-1" size={12} />
                  Debits equal credits
                </ToneBadge>
              ) : (
                <ToneBadge tone="danger">Out of balance</ToneBadge>
              )
            }
            contentClassName="pt-0"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Normal</TableHead>
                  <TableHead className="text-right">Debits</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.accountId}>
                    <TableCell className="font-medium">{row.accountName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.normalBalance}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatZMW(row.totalDebitNgwee)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatZMW(row.totalCreditNgwee)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatZMW(row.balanceNgwee)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-semibold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatZMW(totals.totalDebitNgwee)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatZMW(totals.totalCreditNgwee)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>

        <TabsContent value="segregation" className="pt-4">
          <SectionCard
            title="Client-money segregation"
            icon={ShieldCheck}
            description="Client liabilities must be fully covered by segregated bank assets."
          >
            <div className="space-y-4">
              <StatGrid>
                <StatCard
                  label="Client money owed"
                  value={formatZMW(segregation.clientMoneyNgwee)}
                  icon={Users}
                />
                <StatCard
                  label="Segregated bank assets"
                  value={formatZMW(segregation.segregatedAssetsNgwee)}
                  icon={ShieldCheck}
                />
                <StatCard
                  label="Surplus"
                  value={formatZMW(segregation.surplusNgwee)}
                  tone={segregation.isSegregated ? "positive" : "danger"}
                  icon={CheckCircle2}
                />
              </StatGrid>
              <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                {segregation.isSegregated ? (
                  <ToneBadge tone="positive">Fully segregated</ToneBadge>
                ) : (
                  <ToneBadge tone="danger">Shortfall</ToneBadge>
                )}
                <span className="text-muted-foreground">
                  Coverage {(segregation.coverageBps / 100).toFixed(2)}% of client
                  money held in the segregated settlement bank.
                </span>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="subledger" className="pt-4">
          <SectionCard
            title="Client cash sub-ledger"
            icon={Users}
            contentClassName="pt-0"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Opening</TableHead>
                  <TableHead className="text-right">Movement</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subLedger.map((row) => (
                  <TableRow key={row.clientId}>
                    <TableCell className="font-medium">
                      {row.clientName}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {row.clientId}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatZMW(row.openingNgwee)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatZMW(row.movementNgwee)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatZMW(row.balanceNgwee)}
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
