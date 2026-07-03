"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatZMW } from "@/lib/format";
import { useUserStore } from "@/lib/store/user";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { useCustomerOrdersStore } from "@/lib/store/customer-orders";
import { useCustomerWalletStore } from "@/lib/store/customer-wallet";
import { DEMO_PORTFOLIO } from "@/lib/mock/portfolio";
import { DEFAULT_BOARD_LOT } from "@/lib/config/trading";
import { resolveOrder } from "@/lib/orders/order-math";
import { runPreTradeChecks } from "@/lib/orders/state-machine";
import { PinConfirm } from "@/components/pin-confirm";

type Side = "buy" | "sell";
type EntryMode = "amount" | "shares";
type Step = "input" | "pin" | "cooling" | "done";

type Props = {
  symbol: string;
  name: string;
  lastPriceNgwee: number;
  side: Side;
  open: boolean;
  onClose: () => void;
};

const NGWEE_PER_KWACHA = 100;
const DEFAULT_AMOUNT_ZMW = "500";
const DEFAULT_SHARES = "100";
const COOLING_OFF_SECONDS = 5;

const ENTRY_MODES: { id: EntryMode; label: string }[] = [
  { id: "amount", label: "Amount (ZMW)" },
  { id: "shares", label: "Shares" },
];

function parseZmwToNgwee(value: string): number {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * NGWEE_PER_KWACHA);
}

/** Shares this client already holds of a symbol, from the demo portfolio. */
function heldQtyFor(symbol: string): number {
  const holding = DEMO_PORTFOLIO.equities.find(
    (h) => h.instrument.symbol === symbol
  );
  return holding ? holding.sharesHeld : 0;
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: EntryMode;
  onChange: (next: EntryMode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
      {ENTRY_MODES.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-md py-1.5 text-sm font-medium transition-colors",
            mode === option.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between text-sm",
        emphasize && "border-t pt-2 font-medium"
      )}
    >
      <span className={emphasize ? undefined : "text-muted-foreground"}>
        {label}
      </span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export function TradeDialog({
  symbol,
  name,
  lastPriceNgwee,
  side,
  open,
  onClose,
}: Props) {
  const [mode, setMode] = useState<EntryMode>("amount");
  const [amount, setAmount] = useState(DEFAULT_AMOUNT_ZMW);
  const [shares, setShares] = useState(DEFAULT_SHARES);
  const [step, setStep] = useState<Step>("input");
  const [countdown, setCountdown] = useState(COOLING_OFF_SECONDS);

  const walletNgwee = useCustomerWalletStore((s) => s.balanceNgwee);

  const resolved = resolveOrder({
    side: side === "buy" ? "BUY" : "SELL",
    assetClass: "EQUITY",
    mode: mode === "amount" ? "value" : "quantity",
    priceType: "market",
    lastPriceNgwee,
    quantity: Math.max(0, parseInt(shares) || 0),
    valueNgwee: parseZmwToNgwee(amount),
    boardLot: DEFAULT_BOARD_LOT,
  });

  const checks = runPreTradeChecks({
    side: side === "buy" ? "BUY" : "SELL",
    walletNgwee,
    allInNgwee: resolved.allInNgwee,
    heldQty: heldQtyFor(symbol),
    qty: resolved.resolvedQty,
    boardLot: DEFAULT_BOARD_LOT,
    priceNgwee: lastPriceNgwee,
    lastPriceNgwee,
  });

  const canReview = resolved.resolvedQty > 0 && checks.ok;

  // Cooling-off countdown, the fat-finger catch before the order is queued.
  useEffect(() => {
    if (step !== "cooling") return;
    if (countdown <= 0) {
      placeOrder();
      return;
    }
    const timer = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, countdown]);

  function resetAndClose() {
    setStep("input");
    setCountdown(COOLING_OFF_SECONDS);
    onClose();
  }

  function placeOrder() {
    const displayName = useUserStore.getState().name || "Chanda M.";
    const businessDate = useOpsClockStore.getState().businessDate;
    useCustomerOrdersStore.getState().placeOrder({
      symbol,
      name,
      side: side === "buy" ? "BUY" : "SELL",
      quantity: resolved.resolvedQty,
      priceNgwee: lastPriceNgwee,
      tradeDate: businessDate,
      clientName: displayName,
    });
    setStep("done");
  }

  const actionLabel = `${side === "buy" ? "Buy" : "Sell"} ${resolved.resolvedQty} ${symbol}`;

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant={side === "buy" ? "default" : "destructive"}>
              {side === "buy" ? "Buy" : "Sell"}
            </Badge>
            {symbol} - {name}
          </DialogTitle>
        </DialogHeader>

        {step === "done" && (
          <div className="py-6 text-center">
            <p className="text-lg font-medium text-green-700">Order queued</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your order is queued for the next LuSE session. Track it on your
              portfolio, or switch to Operations to see it staged.
            </p>
          </div>
        )}

        {step === "pin" && (
          <PinConfirm
            action={`${actionLabel} for about ${formatZMW(resolved.allInNgwee)}`}
            onConfirmed={() => {
              setCountdown(COOLING_OFF_SECONDS);
              setStep("cooling");
            }}
            onCancel={() => setStep("input")}
          />
        )}

        {step === "cooling" && (
          <div className="py-6 text-center space-y-3">
            <p className="text-lg font-medium">Placing in {countdown}s</p>
            <p className="text-sm text-muted-foreground">
              A short pause to catch a slip. Tap cancel to stop.
            </p>
            <Button variant="outline" onClick={() => setStep("input")}>
              Cancel
            </Button>
          </div>
        )}

        {step === "input" && (
          <div className="space-y-4 py-2">
            <ModeToggle mode={mode} onChange={setMode} />

            {mode === "amount" ? (
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Amount to invest
                </label>
                <Input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Number of shares
                </label>
                <Input
                  type="number"
                  min="1"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <SummaryRow
                label="Price per share"
                value={formatZMW(lastPriceNgwee)}
              />
              <SummaryRow
                label="Shares (whole lots)"
                value={resolved.resolvedQty.toLocaleString()}
              />
              <SummaryRow
                label="Consideration"
                value={formatZMW(resolved.grossNgwee)}
              />
              <SummaryRow
                label="Brokerage and levies"
                value={formatZMW(
                  resolved.fees.brokerageNgwee + resolved.fees.levyNgwee
                )}
              />
              <SummaryRow label="CSD fee" value={formatZMW(resolved.fees.csdNgwee)} />
              <SummaryRow
                label={side === "buy" ? "All-in cost" : "Net proceeds"}
                value={`${resolved.isEstimate ? "about " : ""}${formatZMW(resolved.allInNgwee)}`}
                emphasize
              />
              {mode === "amount" && resolved.remainderNgwee > 0 && (
                <SummaryRow
                  label="Left in wallet"
                  value={formatZMW(resolved.remainderNgwee)}
                />
              )}
            </div>

            {resolved.isEstimate && (
              <p className="text-xs text-muted-foreground">
                Market order. The total is an estimate at the last traded price
                until the order fills.
              </p>
            )}

            {!checks.ok && resolved.resolvedQty > 0 && (
              <div className="rounded-md bg-destructive/10 p-3 space-y-1">
                {checks.failures.map((f) => (
                  <p key={f.reasonCode} className="text-xs text-destructive">
                    {f.message}
                  </p>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Demo only. No real order is placed. You confirm with your PIN next.
            </p>
          </div>
        )}

        {step === "input" && (
          <DialogFooter>
            <Button variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button
              onClick={() => setStep("pin")}
              variant={side === "buy" ? "default" : "destructive"}
              disabled={!canReview}
            >
              Confirm {side}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
