"use client";

import { useUserStore } from "@/lib/store/user";

function deterministicProgress(label: string): number {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) & 0xffffffff;
  }
  return 20 + (Math.abs(hash) % 65);
}

const DEMO_GOALS = [
  { label: "Grow my savings to ZMW 200,000" },
  { label: "Build an emergency fund" },
  { label: "Save for children's education" },
];

export function GoalsWidget() {
  const { goals, hasCompletedOnboarding } = useUserStore();

  const activeGoals =
    goals.length > 0
      ? goals
      : hasCompletedOnboarding
      ? DEMO_GOALS
      : [];

  if (activeGoals.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        My goals
      </h2>
      <div className="space-y-3">
        {activeGoals.map((goal) => {
          const label = typeof goal === "string" ? goal : goal.label;
          const pct = deterministicProgress(label);
          return (
            <div key={label} className="rounded-xl border border-brand-ink/10 bg-card px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-base font-medium">{label}</p>
                <span className="text-base font-bold tabular-nums text-brand-green">
                  {pct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-green transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
