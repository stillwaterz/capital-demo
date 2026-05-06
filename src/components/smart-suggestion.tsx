"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const SUGGESTION = {
  title: "Roll your 91-day T-bill into 364 days",
  body: "Your 91-day T-bill matures on 16 May. The 364-day tenor is currently yielding 14.2% gross - the highest on the ladder right now. Rolling into it locks in that rate while BoZ holds policy steady. Net of 15% WHT you keep 12.07%.",
  cta: "Review and roll",
};

export function SmartSuggestion() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-brand-green/30 bg-brand-green/5 px-5 py-5">
        <p className="text-sm font-semibold text-brand-green">Roll scheduled for 16 May.</p>
        <p className="text-sm text-muted-foreground mt-1">
          We will place the bid at the next auction. You can cancel any time before maturity.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-brand-copper/20 bg-brand-copper/5 px-5 py-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold tracking-widest uppercase text-brand-copper">
            Idea for you
          </span>
        </div>
        <p className="text-base font-semibold mb-2">{SUGGESTION.title}</p>
        <p className="text-base text-muted-foreground leading-relaxed mb-4">
          {SUGGESTION.body}
        </p>
        <Button
          size="sm"
          onClick={() => setShowConfirm(true)}
          className="bg-brand-copper/90 hover:bg-brand-copper text-white border-0"
        >
          {SUGGESTION.cta}
        </Button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold font-display mb-2">Confirm roll</h3>
            <p className="text-base text-muted-foreground mb-6">
              Roll ZMW 500,000 face value from 91-day into 364-day at next auction on 23 May 2026. Gross yield 14.2%, net 12.07% after WHT.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-brand-green hover:bg-brand-green-light text-brand-cream"
                onClick={() => { setShowConfirm(false); setConfirmed(true); }}
              >
                Confirm (demo)
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
