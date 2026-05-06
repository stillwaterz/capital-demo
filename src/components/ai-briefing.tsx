"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { useUserStore } from "@/lib/store/user";
import { DEMO_PORTFOLIO, portfolioTotalNgwee, holdingPnLPercent } from "@/lib/mock/portfolio";
import { NEWS_ITEMS } from "@/lib/mock/news";
import { formatZMW, formatPercent } from "@/lib/format";

function buildPortfolioSummary(): string {
  const total = portfolioTotalNgwee(DEMO_PORTFOLIO);
  const equityLines = DEMO_PORTFOLIO.equities.map((h) => {
    const pnl = holdingPnLPercent(h);
    return `${h.instrument.symbol} (${h.instrument.name}): ${formatZMW(h.sharesHeld * h.instrument.lastPriceNgwee)}, ${formatPercent(pnl)} P/L, today ${formatPercent(h.instrument.changePercent)}`;
  });
  const tbillLines = DEMO_PORTFOLIO.tbills.map(
    (t) => `${t.tenor.label} T-bill: face value ${formatZMW(t.faceValueNgwee)}, yield ${t.tenor.yieldPercent}%, matures ${t.maturityDate}${t.autoRoll ? " (auto-roll on)" : ""}`
  );
  return [
    `Total portfolio value: ${formatZMW(total)}`,
    "Equities:",
    ...equityLines,
    "T-bills:",
    ...tbillLines,
  ].join("\n");
}

export function AiBriefing() {
  const { name } = useUserStore();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const fetchBriefing = useCallback(async () => {
    setLoading(true);
    setText("");
    setDone(false);

    const payload = {
      userName: name || undefined,
      portfolioSummary: buildPortfolioSummary(),
      newsHeadlines: NEWS_ITEMS.slice(0, 5).map((n) => n.headline),
    };

    try {
      const res = await fetch("/api/ai/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok || !res.body) throw new Error("Network error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      setLoading(false);

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        setText((prev) => prev + decoder.decode(value, { stream: true }));
      }
      setDone(true);
    } catch (err) {
      setLoading(false);
      setText("Unable to load briefing right now. Try refreshing.");
      setDone(true);
    }
  }, [name]);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  return (
    <div className="rounded-2xl bg-brand-ink text-brand-cream px-5 py-5 relative">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-widest uppercase text-brand-copper">
          AI Briefing
        </span>
        <button
          onClick={fetchBriefing}
          disabled={loading}
          className="text-brand-cream/40 hover:text-brand-cream transition-colors disabled:opacity-30"
          title="Refresh briefing"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && (
        <div className="space-y-2.5 animate-pulse">
          <div className="h-4 bg-brand-cream/10 rounded w-full" />
          <div className="h-4 bg-brand-cream/10 rounded w-5/6" />
          <div className="h-4 bg-brand-cream/10 rounded w-4/6" />
        </div>
      )}

      {!loading && (
        <p className="text-base leading-relaxed italic text-brand-cream/90">
          {text}
          {!done && (
            <span className="inline-block w-0.5 h-4 bg-brand-copper ml-0.5 animate-pulse align-text-bottom" />
          )}
        </p>
      )}
    </div>
  );
}
