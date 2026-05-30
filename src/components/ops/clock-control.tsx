"use client";

import { CalendarClock, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { formatDateZM } from "@/lib/format";

export function ClockControl() {
  const { businessDate, advanceDay, reset } = useOpsClockStore();

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarClock size={16} className="text-brand-green" />
        <span className="tabular-nums text-foreground font-medium">
          {formatDateZM(businessDate)}
        </span>
      </div>
      <Button
        size="sm"
        variant="default"
        onClick={advanceDay}
        className="bg-brand-green text-brand-cream hover:bg-brand-green-light"
      >
        Advance to T+1
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
