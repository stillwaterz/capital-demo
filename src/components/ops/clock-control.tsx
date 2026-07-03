"use client";

import { CalendarClock, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { formatDateZM } from "@/lib/format";

export function ClockControl() {
  const { businessDate, advanceDay, reset } = useOpsClockStore();

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-background/80 px-1 py-0.5">
      <div className="hidden items-center gap-1.5 px-1.5 text-xs text-muted-foreground lg:flex">
        <CalendarClock size={14} className="text-brand-green" />
        <span className="tabular-nums font-medium text-foreground">
          {formatDateZM(businessDate)}
        </span>
      </div>
      <Button
        size="xs"
        onClick={advanceDay}
        className="bg-brand-green text-brand-cream hover:bg-brand-green-light"
      >
        <span className="hidden sm:inline">Advance to T+1</span>
        <span className="sm:hidden">T+1</span>
        <ChevronRight />
      </Button>
      <Button
        size="icon-xs"
        variant="ghost"
        onClick={reset}
        aria-label="Reset business clock"
        title="Reset business clock"
      >
        <RotateCcw size={14} />
      </Button>
    </div>
  );
}
