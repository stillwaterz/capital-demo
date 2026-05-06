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
import { formatZMW } from "@/lib/format";

type Side = "buy" | "sell";

type Props = {
  symbol: string;
  name: string;
  lastPriceNgwee: number;
  side: Side;
  open: boolean;
  onClose: () => void;
};

export function TradeDialog({
  symbol,
  name,
  lastPriceNgwee,
  side,
  open,
  onClose,
}: Props) {
  const [shares, setShares] = useState("100");
  const [confirmed, setConfirmed] = useState(false);

  const sharesNum = Math.max(0, parseInt(shares) || 0);

  function handleConfirm() {
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      onClose();
    }, 1800);
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
              Your order is queued for execution at the next LuSE session.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price per share</span>
              <span>{formatZMW(lastPriceNgwee)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium border-t pt-2">
              <span>Estimated total</span>
              <span>{formatZMW(sharesNum * lastPriceNgwee)}</span>
            </div>
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
