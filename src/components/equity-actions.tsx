"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TradeDialog } from "@/components/trade-dialog";

type Props = {
  symbol: string;
  name: string;
  lastPriceNgwee: number;
};

export function EquityActions({ symbol, name, lastPriceNgwee }: Props) {
  const [dialog, setDialog] = useState<"buy" | "sell" | null>(null);
  const router = useRouter();

  function handleAskClick() {
    const q = encodeURIComponent(`Why did ${name} (${symbol}) move today?`);
    router.push(`/ask?q=${q}`);
  }

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={() => setDialog("buy")} size="sm">
          Buy
        </Button>
        <Button
          onClick={() => setDialog("sell")}
          size="sm"
          variant="destructive"
        >
          Sell
        </Button>
        <Button onClick={handleAskClick} size="sm" variant="outline">
          Why did it move?
        </Button>
      </div>

      {dialog && (
        <TradeDialog
          symbol={symbol}
          name={name}
          lastPriceNgwee={lastPriceNgwee}
          side={dialog}
          open
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
