"use client";

import { useState } from "react";

type Props = {
  initialValue: boolean;
  label?: string;
};

export function AutorollToggle({ initialValue, label }: Props) {
  const [enabled, setEnabled] = useState(initialValue);

  return (
    <button
      onClick={() => setEnabled((v) => !v)}
      className={`flex items-center gap-2 text-sm font-medium transition-colors ${
        enabled ? "text-green-700" : "text-muted-foreground"
      }`}
      aria-pressed={enabled}
    >
      <span
        className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
          enabled ? "bg-green-600" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      {label ?? "Auto-roll on maturity"}
    </button>
  );
}
