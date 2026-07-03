"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatZMW, formatDateZM } from "@/lib/format";
import { addBusinessDays } from "@/lib/ops/clock";
import { SETTLEMENT_CYCLE_DAYS } from "@/lib/config/trading";
import { useCustomerOrdersStore } from "@/lib/store/customer-orders";

/**
 * Plain client tracker for orders in progress.
 *
 * The app feels instant but shows the honest settlement date, the T+n cycle, so
 * nobody expects shares the same second (BUILD_SPEC section 14).
 */
export function OrderTracker() {
  const orders = useCustomerOrdersStore((s) => s.orders);

  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No orders in progress. Your filled orders and their arrival dates show
        here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const arrival = addBusinessDays(order.tradeDate, SETTLEMENT_CYCLE_DAYS);
        const grossNgwee = order.quantity * order.priceNgwee;
        return (
          <Card key={order.id} className="border border-brand-ink/10">
            <CardContent className="py-4 px-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={order.side === "BUY" ? "default" : "destructive"}>
                    {order.side === "BUY" ? "Buy" : "Sell"}
                  </Badge>
                  <p className="font-semibold text-brand-ink">{order.symbol}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {order.quantity.toLocaleString()} shares at{" "}
                  {formatZMW(order.priceNgwee)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium tabular-nums">{formatZMW(grossNgwee)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Arrives {formatDateZM(arrival)}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
