"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Instrument } from "@/lib/mock/instruments";
import { formatZMW, formatPercent } from "@/lib/format";

type SortKey = "alpha" | "change" | "price";

const SECTORS = ["All", "Telecommunications", "Consumer Goods", "Utilities", "Energy", "Industrials", "Financials", "Reinsurance", "Real Estate", "Food and Agriculture", "Forestry", "Technology"];

export function EquitiesClient({ instruments }: { instruments: Instrument[] }) {
  const [sector, setSector] = useState("All");
  const [sort, setSort] = useState<SortKey>("alpha");

  const filtered = instruments
    .filter((i) => sector === "All" || i.sector === sector)
    .sort((a, b) => {
      if (sort === "change") return b.changePercent - a.changePercent;
      if (sort === "price") return b.lastPriceNgwee - a.lastPriceNgwee;
      return a.symbol.localeCompare(b.symbol);
    });

  const activeSectors = ["All", ...Array.from(new Set(instruments.map((i) => i.sector))).sort()];

  return (
    <div className="space-y-4">
      {/* Sector filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {activeSectors.map((s) => (
          <button
            key={s}
            onClick={() => setSector(s)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              sector === s
                ? "bg-brand-ink text-brand-cream border-brand-ink"
                : "border-border text-muted-foreground hover:border-brand-ink/40"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Sort:</span>
        {(["alpha", "change", "price"] as SortKey[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
              sort === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-foreground/40"
            }`}
          >
            {s === "alpha" ? "A-Z" : s === "change" ? "Daily change" : "Price"}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} companies</span>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((ins) => {
          const positive = ins.changePercent >= 0;
          return (
            <Link key={ins.symbol} href={`/equities/${ins.symbol}`}>
              <Card className="border border-brand-ink/10 hover:-translate-y-0.5 hover:border-brand-green/40 transition-all">
                <CardContent className="py-4 px-5 flex items-center justify-between min-h-16">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-base text-brand-ink">{ins.symbol}</p>
                      <Badge variant="outline" className="text-xs">{ins.sector}</Badge>
                      {ins.board === "alt-m" && (
                        <Badge className="text-xs bg-brand-copper/10 text-brand-copper border-brand-copper/20">Alt-M</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{ins.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-base tabular-nums">{formatZMW(ins.lastPriceNgwee)}</p>
                    <span className={`text-sm font-medium tabular-nums ${positive ? "text-brand-copper" : "text-red-600"}`}>
                      {formatPercent(ins.changePercent)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
