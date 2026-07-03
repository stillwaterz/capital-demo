"use client";

import { useState } from "react";
import { Radar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, SectionCard } from "@/components/ops/ops-kit";
import { SeverityBadge } from "@/components/ops/ops-badges";
import { OpsDetailSheet } from "@/components/ops/ops-detail-sheet";
import { formatZMW } from "@/lib/format";
import { useCustomerWalletStore } from "@/lib/store/customer-wallet";
import { useCustomerOrdersStore } from "@/lib/store/customer-orders";
import { computeTradeFees } from "@/lib/ops/trades";
import {
  runSurveillance,
  type SurveillanceAlert,
} from "@/lib/compliance/surveillance";
import type { LedgerEntryRow } from "@/lib/db/types";

const DEMO_ACCOUNT_ID = "demo-account";
const DEMO_TENANT_ID = "capital-demo";

function useLiveLedgerEntries(): LedgerEntryRow[] {
  const walletEntries = useCustomerWalletStore((s) => s.entries);
  const orders = useCustomerOrdersStore((s) => s.orders);

  const fromWallet: LedgerEntryRow[] = walletEntries.map((e) => ({
    id: e.id,
    tenant_id: DEMO_TENANT_ID,
    account_id: DEMO_ACCOUNT_ID,
    type: e.type,
    amount_ngwee: Math.abs(e.amountNgwee),
    idempotency_key: e.idempotencyKey,
    related_ref: null,
    created_at: e.at,
  }));

  const fromOrders: LedgerEntryRow[] = orders.map((o) => {
    const gross = o.quantity * o.priceNgwee;
    const fees = computeTradeFees(gross, "EQUITY").totalNgwee;
    return {
      id: `ord-${o.id}`,
      tenant_id: DEMO_TENANT_ID,
      account_id: DEMO_ACCOUNT_ID,
      type: o.side === "BUY" ? "trade_debit" : "trade_credit",
      amount_ngwee: gross + (o.side === "BUY" ? fees : -fees),
      idempotency_key: `ord-${o.id}`,
      related_ref: o.symbol,
      created_at: o.placedAt,
    };
  });

  return [...fromWallet, ...fromOrders];
}

export function SurveillancePanel() {
  const entries = useLiveLedgerEntries();
  const alerts = runSurveillance(entries);
  const [selectedAlert, setSelectedAlert] = useState<SurveillanceAlert | null>(
    null
  );

  return (
    <>
      <SectionCard
        title="Live surveillance (this session)"
        icon={Radar}
        description="Threshold, velocity and structuring rules run over your own deposits, withdrawals and trades. Reason codes explain every alert."
        contentClassName={alerts.length === 0 ? undefined : "pt-0"}
      >
      {alerts.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="No session alerts"
          description="Fund the wallet or place trades above the reporting threshold to see the rules fire."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Reason codes</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert, index) => (
              <TableRow
                key={`${alert.type}-${index}`}
                onClick={() => setSelectedAlert(alert)}
                className="cursor-pointer align-top"
              >
                <TableCell>
                  <Badge variant="outline">{alert.type}</Badge>
                </TableCell>
                <TableCell>
                  <SeverityBadge severity={alert.severity} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {alert.reason_codes.map((code) => (
                      <Badge key={code} variant="outline" className="text-xs">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="max-w-md text-muted-foreground">
                  <span className="line-clamp-2">{alert.description}</span>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {alert.amount_ngwee === null ? "-" : formatZMW(alert.amount_ngwee)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      </SectionCard>

      <OpsDetailSheet
        open={selectedAlert !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedAlert(null);
        }}
        title={selectedAlert ? selectedAlert.type : ""}
        subtitle={
          selectedAlert ? "AML surveillance alert raised this session" : undefined
        }
        badge={
          selectedAlert ? (
            <SeverityBadge severity={selectedAlert.severity} />
          ) : undefined
        }
        fields={
          selectedAlert
            ? [
                { label: "Account", value: selectedAlert.account_id },
                { label: "Status", value: selectedAlert.status },
                {
                  label: "Amount",
                  value:
                    selectedAlert.amount_ngwee === null
                      ? "-"
                      : formatZMW(selectedAlert.amount_ngwee),
                  mono: true,
                },
              ]
            : []
        }
      >
        {selectedAlert ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">Reason codes</p>
              <div className="flex flex-wrap gap-1">
                {selectedAlert.reason_codes.map((code) => (
                  <Badge key={code} variant="outline" className="text-xs">
                    {code}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm leading-relaxed text-foreground">
                {selectedAlert.description}
              </p>
            </div>
          </div>
        ) : null}
      </OpsDetailSheet>
    </>
  );
}
