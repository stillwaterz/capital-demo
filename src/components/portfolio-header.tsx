"use client";

import { useUserStore } from "@/lib/store/user";
import { formatZMW } from "@/lib/format";

type Props = { totalNgwee: number; fallbackName: string };

export function PortfolioHeader({ totalNgwee, fallbackName }: Props) {
  const { name } = useUserStore();
  const displayName = name || fallbackName;

  return (
    <section>
      <p className="text-sm text-muted-foreground tracking-wide">
        {displayName}&apos;s portfolio
      </p>
      <p className="text-4xl sm:text-5xl font-bold tracking-tight mt-1 font-display tabular-nums">
        {formatZMW(totalNgwee)}
      </p>
      <p className="text-sm text-muted-foreground mt-1.5">
        Equities and T-bills at current value
      </p>
    </section>
  );
}
