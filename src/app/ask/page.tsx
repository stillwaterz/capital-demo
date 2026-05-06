import { Suspense } from "react";
import { AskPageInner } from "@/components/ask-page-inner";

export default function AskPage() {
  return (
    <div className="space-y-4">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">Ask</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ask anything about LuSE counters, T-bills, BoZ policy or market
          events.
        </p>
      </section>
      <Suspense>
        <AskPageInner />
      </Suspense>
    </div>
  );
}
