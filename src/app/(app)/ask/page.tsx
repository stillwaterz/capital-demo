import { Suspense } from "react";
import { AskPageInner } from "@/components/ask-page-inner";

export default function AskPage() {
  return (
    <div className="space-y-4">
      <section>
        <h1 className="text-2xl font-bold tracking-tight font-display">Ask</h1>
        <p className="text-base text-muted-foreground mt-1">
          Ask anything about your portfolio, the markets or government securities. MarketLink answers in plain Zambian-context English.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {["Why did Zambeef move today?", "What is the current BoZ rate?", "How do T-bills work?", "Compare CEC and ATEL"].map((q) => (
            <a
              key={q}
              href={`/ask?q=${encodeURIComponent(q)}`}
              className="text-xs px-3 py-2 rounded-lg border border-brand-ink/10 text-muted-foreground hover:border-brand-green/40 hover:text-brand-ink transition-colors"
            >
              {q}
            </a>
          ))}
        </div>
      </section>
      <Suspense>
        <AskPageInner />
      </Suspense>
    </div>
  );
}
