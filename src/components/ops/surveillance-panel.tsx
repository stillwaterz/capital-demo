"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/ops/ops-badges";
import { formatZMW } from "@/lib/format";
import { useCustomerWalletStore } from "@/lib/store/customer-wallet";
import { useCustomerOrdersStore } from "@/lib/store/customer-orders";
import { computeTradeFees } from "@/lib/ops/trades";
import { runSurveillance } from "@/lib/compliance/surveillance";
import type { LedgerEntryRow } from "@/lib/db/types";

const DEMO_ACCOUNT_ID = "demo-account";
const DEMO_TENANT_ID = "capital-demo";

/** Turn live customer wallet and order activity into ledger entries to monitor. */
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

/**
 * Live AML surveillance over the demo client's own funding and trading, using
 * the same reason-coded rules as production. Explains why each alert fired.
 */
export function SurveillancePanel() {
  const entries = useLiveLedgerEntries();
  const alerts = runSurveillance(entries);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live surveillance (this session)</CardTitle>
        <CardDescription>
          Threshold, velocity and structuring rules run over your own deposits,
          withdrawals and trades. Reason codes explain every alert.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No alerts from this session yet. Fund the wallet or place trades above
            the reporting threshold to see the rules fire.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Severity</th>
                <th className="py-2 pr-3 font-medium">Reason codes</th>
                <th className="py-2 pr-3 font-medium">Detail</th>
                <th className="py-2 pl-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert, index) => (
                <tr key={`${alert.type}-${index}`} className="border-b align-top last:border-0">
                  <td className="py-3 pr-3">
                    <Badge variant="outline">{alert.type}</Badge>
                  </td>
                  <td className="py-3 pr-3">
                    <SeverityBadge severity={alert.severity} />
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex flex-wrap gap-1">
                      {alert.reason_codes.map((code) => (
                        <Badge key={code} variant="outline" className="text-xs">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="max-w-md py-3 pr-3 text-muted-foreground">
                    {alert.description}
                  </td>
                  <td className="py-3 pl-3 text-right whitespace-nowrap tabular-nums">
                    {alert.amount_ngwee === null ? "-" : formatZMW(alert.amount_ngwee)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
