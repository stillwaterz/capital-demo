"use client";

import { useState } from "react";
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

type Side = "buy" | "sell";
type EntryMode = "amount" | "shares";

type Props = {
  symbol: string;
  name: string;
  lastPriceNgwee: number;
  side: Side;
  open: boolean;
  onClose: () => void;
};

const NGWEE_PER_KWACHA = 100;
const AUTO_CLOSE_MS = 1800;
const DEFAULT_AMOUNT_ZMW = "500";
const DEFAULT_SHARES = "100";
const NO_FEE_NGWEE = 0;

const ENTRY_MODES: { id: EntryMode; label: string }[] = [
  { id: "amount", label: "Amount (ZMW)" },
  { id: "shares", label: "Shares" },
];

/** Parse a user-typed kwacha string into integer ngwee. Empty/NaN/negative becomes 0. */
function parseZmwToNgwee(value: string): number {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * NGWEE_PER_KWACHA);
}

/** Resolve whole shares and the estimated total in ngwee for the active entry mode. */
function resolveOrder(
  mode: EntryMode,
  amount: string,
  shares: string,
  lastPriceNgwee: number,
): { sharesNum: number; estimatedTotalNgwee: number } {
  const sharesNum =
    mode === "amount"
      ? lastPriceNgwee > 0
        ? Math.floor(parseZmwToNgwee(amount) / lastPriceNgwee)
        : 0
      : Math.max(0, parseInt(shares) || 0);
  return { sharesNum, estimatedTotalNgwee: sharesNum * lastPriceNgwee };
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
              : "text-muted-foreground hover:text-foreground",
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
        emphasize && "border-t pt-2 font-medium",
      )}
    >
      <span className={emphasize ? undefined : "text-muted-foreground"}>
        {label}
      </span>
      <span>{value}</span>
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
  const [confirmed, setConfirmed] = useState(false);

  const { sharesNum, estimatedTotalNgwee } = resolveOrder(
    mode,
    amount,
    shares,
    lastPriceNgwee,
  );

  function handleConfirm() {
    const displayName = useUserStore.getState().name || "Chanda M.";
    const businessDate = useOpsClockStore.getState().businessDate;
    useCustomerOrdersStore.getState().placeOrder({
      symbol,
      name,
      side: side === "buy" ? "BUY" : "SELL",
      quantity: sharesNum,
      priceNgwee: lastPriceNgwee,
      tradeDate: businessDate,
      clientName: displayName,
    });
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      onClose();
    }, AUTO_CLOSE_MS);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant={side === "buy" ? "default" : "destructive"}>
              {side === "buy" ? "Buy" : "Sell"}
            </Badge>
            {symbol} - {name}
          </DialogTitle>
        </DialogHeader>

        {confirmed ? (
          <div className="py-6 text-center">
            <p className="text-lg font-medium text-green-700">
              Order sent to broker
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your order is queued for execution at the next LuSE session. Switch
              to Operations to see it on the settlement board.
            </p>
          </div>
        ) : (
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
              {mode === "amount" && (
                <SummaryRow
                  label="Shares you can buy"
                  value={String(sharesNum)}
                />
              )}
              <SummaryRow label="Fees" value={formatZMW(NO_FEE_NGWEE)} />
              <SummaryRow
                label="Estimated total"
                value={formatZMW(estimatedTotalNgwee)}
                emphasize
              />
            </div>

            {mode === "amount" && (
              <p className="text-xs text-muted-foreground">
                Whole shares only, so the total may be a little under the amount
                you entered. No platform fees on this demo.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Demo only - no real order is placed.
            </p>
          </div>
        )}

        {!confirmed && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant={side === "buy" ? "default" : "destructive"}
              disabled={sharesNum === 0}
            >
              Confirm {side}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
