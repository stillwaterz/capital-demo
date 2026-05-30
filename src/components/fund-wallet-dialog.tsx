"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatZMW } from "@/lib/format";
import { useCustomerWalletStore } from "@/lib/store/customer-wallet";

const NGWEE_PER_KWACHA = 100;
const AUTO_CLOSE_MS = 1800;

type Props = {
  open: boolean;
  onClose: () => void;
};

function parseZmwToNgwee(value: string): number {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * NGWEE_PER_KWACHA);
}

export function FundWalletDialog({ open, onClose }: Props) {
  const [amount, setAmount] = useState("1000");
  const [confirmed, setConfirmed] = useState(false);
  const balanceNgwee = useCustomerWalletStore((s) => s.balanceNgwee);
  const fund = useCustomerWalletStore((s) => s.fund);

  const amountNgwee = parseZmwToNgwee(amount);

  function handleConfirm() {
    if (amountNgwee <= 0) return;
    fund(amountNgwee);
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
          <DialogTitle>Fund wallet</DialogTitle>
        </DialogHeader>

        {confirmed ? (
          <div className="py-6 text-center">
            <p className="text-lg font-medium text-green-700">
              Deposit received
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {formatZMW(amountNgwee)} added via Airtel Money (demo).
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Current balance: {formatZMW(balanceNgwee)}
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Amount (ZMW)
              </label>
              <Input
                type="number"
                min="0"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Demo only. No real mobile money call is made.
            </p>
          </div>
        )}

        {!confirmed && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={amountNgwee <= 0}>
              Confirm deposit
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
