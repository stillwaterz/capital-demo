"use client";

import { useRef, useState } from "react";
import { Check, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  extractProposedAction,
  type OpsContext,
  type OpsTask,
} from "@/lib/ai/ops-prompts";
import { streamOpsAi } from "@/lib/ai/ops-stream";
import { useOpsGovernanceStore } from "@/lib/store/ops-governance";
import type { ProposalKind } from "@/lib/ops/types";

const DEFAULT_PROMPT: Record<OpsTask, string> = {
  "settlement-fail": "Explain this settlement fail and propose a fix.",
  "recon-break": "Explain this reconciliation break and propose a next step.",
  "str-narrative": "Draft the STR narrative for this case and propose filing it.",
  "morning-briefing": "Give me the morning operations briefing.",
};

type Props = {
  task: OpsTask;
  context: OpsContext;
  /** When set, an approved action can be proposed from the answer. */
  proposalKind?: ProposalKind;
  /** The subsystem entity the proposal acts on, for example a trade id. */
  targetRef?: string;
  /** A short fallback summary when the model emits no proposed action line. */
  fallbackSummary?: string;
  label?: string;
};

/**
 * Compact inline assistant. Streams a grounded explanation for a single fail,
 * break or alert and offers to send a proposed action to the approvals queue.
 * AI proposes, a human checker disposes.
 */
export function AskAiButton({
  task,
  context,
  proposalKind,
  targetRef,
  fallbackSummary,
  label = "Ask AI",
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);
  const [proposed, setProposed] = useState(false);
  const started = useRef(false);
  const addProposal = useOpsGovernanceStore((s) => s.addProposal);

  async function run() {
    setLoading(true);
    setError(false);
    setAnswer("");
    try {
      await streamOpsAi({
        task,
        context,
        messages: [{ role: "user", content: DEFAULT_PROMPT[task] }],
        onChunk: setAnswer,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !started.current) {
      started.current = true;
      void run();
    }
  }

  function sendToApprovals() {
    if (!proposalKind || !targetRef) return;
    const summary =
      extractProposedAction(answer) ??
      fallbackSummary ??
      DEFAULT_PROMPT[task];
    addProposal({ kind: proposalKind, summary, targetRef });
    setProposed(true);
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" size="xs" onClick={toggle} aria-expanded={open}>
        <Sparkles />
        {label}
      </Button>

      {open ? (
        <div className="rounded-lg border bg-card p-3 text-sm">
          <div className="flex items-center justify-between gap-2 pb-2">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Sparkles size={13} className="text-brand-green" />
              Capital AI
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
            >
              <X />
            </Button>
          </div>

          {error ? (
            <p className="text-destructive">
              Something went wrong. Check the connection and try again.
            </p>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed text-foreground">
              {answer || (
                <span className="animate-pulse text-muted-foreground">
                  Thinking...
                </span>
              )}
            </p>
          )}

          {proposalKind && targetRef && !error && answer && !loading ? (
            <>
              <Separator className="my-3" />
              {proposed ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <Check size={14} />
                  Sent to approvals. A human checker must approve it.
                </span>
              ) : (
                <Button
                  size="xs"
                  className="bg-brand-green text-brand-cream hover:bg-brand-green-light"
                  onClick={sendToApprovals}
                >
                  <Send />
                  Propose action
                </Button>
              )}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
