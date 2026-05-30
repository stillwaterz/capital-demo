"use client";

import { CalendarClock, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { formatDateZM } from "@/lib/format";

/**
 * Prominent business-clock control for a subsystem board. Advancing the day
 * recomputes every engine, so settlement, the ledger and recon all move on the
 * same click.
 */
export function AdvanceClock({ label = "Advance to T+1" }: { label?: string }) {
  const businessDate = useOpsClockStore((s) => s.businessDate);
  const advanceDay = useOpsClockStore((s) => s.advanceDay);
  const reset = useOpsClockStore((s) => s.reset);

  return (
    <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 ring-1 ring-foreground/10">
      <div className="flex items-center gap-1.5 pr-1 text-sm">
        <CalendarClock size={16} className="text-brand-green" />
        <span className="hidden text-muted-foreground sm:inline">Business date</span>
        <span className="font-medium tabular-nums text-foreground">
          {formatDateZM(businessDate)}
        </span>
      </div>
      <Button
        size="sm"
        onClick={advanceDay}
        className="bg-brand-green text-brand-cream hover:bg-brand-green-light"
      >
        {label}
        <ChevronRight />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={reset}
        aria-label="Reset business clock"
        title="Reset business clock"
      >
        <RotateCcw />
      </Button>
    </div>
  );
}
