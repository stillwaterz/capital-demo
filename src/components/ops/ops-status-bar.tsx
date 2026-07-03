"use client";

import Link from "next/link";
import { Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { formatDateZM } from "@/lib/format";
import { useOpsNavCounts } from "@/lib/hooks/use-ops-nav-counts";
import { cn } from "@/lib/utils";

function marketSessionLabel(): { label: string; tone: "open" | "closed" } {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const isWeekday = day >= 1 && day <= 5;
  const isOpen = isWeekday && hour >= 9 && hour < 16;
  return isOpen
    ? { label: "LuSE session open", tone: "open" }
    : { label: "LuSE session closed", tone: "closed" };
}

export function OpsStatusBar({ className }: { className?: string }) {
  const businessDate = useOpsClockStore((s) => s.businessDate);
  const counts = useOpsNavCounts();
  const session = marketSessionLabel();
  const needsAttention = counts.attentionTotal > 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 text-xs",
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span
          className={cn(
            "size-1.5 rounded-full",
            session.tone === "open" ? "bg-emerald-500" : "bg-muted-foreground/50"
          )}
          aria-hidden
        />
        {session.label}
      </span>

      <span className="hidden text-muted-foreground sm:inline">
        Business date{" "}
        <span className="font-medium tabular-nums text-foreground">
          {formatDateZM(businessDate)}
        </span>
      </span>

      {needsAttention ? (
        <Link
          href="/ops"
          className="inline-flex items-center gap-1.5 font-medium text-amber-700 transition-colors hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
        >
          <AlertCircle size={13} aria-hidden />
          {counts.attentionTotal} item{counts.attentionTotal === 1 ? "" : "s"} need attention
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 size={13} aria-hidden />
          All systems nominal
        </span>
      )}

      <span className="hidden items-center gap-1.5 text-muted-foreground lg:inline-flex">
        <Activity size={13} aria-hidden />
        Demo mode
      </span>
    </div>
  );
}
