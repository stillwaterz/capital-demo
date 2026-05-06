"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TradeDialog } from "@/components/trade-dialog";

type Props = {
  symbol: string;
  name: string;
  lastPriceNgwee: number;
  mobile?: boolean;
};

export function EquityActions({ symbol, name, lastPriceNgwee, mobile }: Props) {
  const [dialog, setDialog] = useState<"buy" | "sell" | null>(null);
  const router = useRouter();

  function handleAskClick() {
    const q = encodeURIComponent(`Why did ${name} (${symbol}) move today?`);
    router.push(`/ask?q=${q}`);
  }

  return (
    <>
      <div className={mobile ? "flex gap-3 w-full" : "flex gap-2"}>
        <Button
          onClick={() => setDialog("buy")}
          size={mobile ? "lg" : "default"}
          className={`bg-brand-green hover:bg-brand-green-light text-brand-cream active:scale-98 ${mobile ? "flex-1" : ""}`}
        >
          Buy
        </Button>
        <Button
          onClick={() => setDialog("sell")}
          size={mobile ? "lg" : "default"}
          variant="destructive"
          className={`active:scale-98 ${mobile ? "flex-1" : ""}`}
        >
          Sell
        </Button>
        {!mobile && (
          <Button onClick={handleAskClick} size="default" variant="outline" className="active:scale-98">
            Why did it move?
          </Button>
        )}
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
