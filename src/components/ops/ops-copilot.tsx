"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Send, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  extractProposedAction,
  PROPOSAL_KIND_BY_TASK,
  type OpsContext,
  type OpsMessage,
  type OpsTask,
} from "@/lib/ai/ops-prompts";
import { streamOpsAi } from "@/lib/ai/ops-stream";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { useOpsGovernanceStore } from "@/lib/store/ops-governance";
import { formatDateZM } from "@/lib/format";
import type { IsoDate, ProposalKind } from "@/lib/ops/types";
import {
  listSettlementFails,
  settlementSummary,
} from "@/lib/ops/settlement";
import { listReconBreaks, reconSummary } from "@/lib/ops/reconciliation";
import { treasurySummary } from "@/lib/ops/treasury";
import {
  complianceSummary,
  getOpenAlerts,
  getStrCases,
} from "@/lib/ops/compliance";
import { kycSummary } from "@/lib/ops/kyc-queue";
import { riskSummary } from "@/lib/ops/risk";
import { regReportingSummary } from "@/lib/ops/reg-reporting";

type DisplayMessage = OpsMessage & { id: string };

type QuickAction = {
  label: string;
  task: OpsTask;
  prompt: string;
  build: (businessDate: IsoDate) => {
    context: OpsContext;
    targetRef: string | null;
    fallback: string;
  };
};

const QUICK_ACTIONS: readonly QuickAction[] = [
  {
    label: "Brief me on today",
    task: "morning-briefing",
    prompt: "Give me the morning operations briefing.",
    build: (businessDate) => ({
      context: {
        subsystem: "Operations control tower",
        businessDate: formatDateZM(businessDate),
        facts: {
          settlement: settlementSummary(businessDate),
          reconciliation: reconSummary(businessDate),
          treasury: treasurySummary(businessDate),
          compliance: complianceSummary(),
          kyc: kycSummary(),
          risk: riskSummary(),
          reporting: regReportingSummary(businessDate),
        },
      },
      targetRef: null,
      fallback: "",
    }),
  },
  {
    label: "Investigate settlement fails",
    task: "settlement-fail",
    prompt: "Investigate the settlement fails and propose a fix.",
    build: (businessDate) => {
      const fails = listSettlementFails(businessDate);
      return {
        context: {
          subsystem: "Settlement",
          businessDate: formatDateZM(businessDate),
          facts: { summary: settlementSummary(businessDate), fails },
        },
        targetRef: fails[0]?.tradeId ?? null,
        fallback: "Bridge the short cash leg on the failing trade from treasury float.",
      };
    },
  },
  {
    label: "Explain recon breaks",
    task: "recon-break",
    prompt: "Explain the open reconciliation breaks and propose a next step.",
    build: (businessDate) => {
      const breaks = listReconBreaks(businessDate);
      return {
        context: {
          subsystem: "Reconciliation",
          businessDate: formatDateZM(businessDate),
          facts: { summary: reconSummary(businessDate), breaks },
        },
        targetRef: breaks.find((b) => b.type !== "CASH")?.id ?? breaks[0]?.id ?? null,
        fallback: "Release the confirmed reconciliation break once the offset is posted.",
      };
    },
  },
  {
    label: "Draft STR narrative",
    task: "str-narrative",
    prompt: "Draft the STR narrative for the open structuring case and propose filing it.",
    build: (businessDate) => {
      const cases = getStrCases();
      const alerts = getOpenAlerts().filter(
        (a) => a.type === "STRUCTURING" || a.type === "SANCTIONS"
      );
      const draft = cases.find((c) => c.status === "DRAFT") ?? cases[0];
      return {
        context: {
          subsystem: "Compliance",
          businessDate: formatDateZM(businessDate),
          facts: { cases, alerts },
        },
        targetRef: draft?.id ?? null,
        fallback: "File the drafted suspicious transaction report with the FIC.",
      };
    },
  },
];

type PendingAction = {
  kind: ProposalKind;
  targetRef: string;
  fallback: string;
} | null;

/**
 * Console-wide AI ops copilot. Opens from the header, streams grounded answers
 * from the ops AI route and hands proposed actions to the maker-checker queue.
 * It only explains and proposes. Nothing is executed here.
 */
export function OpsCopilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<OpsTask>("morning-briefing");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [proposedId, setProposedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const addProposal = useOpsGovernanceStore((s) => s.addProposal);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(task: OpsTask, prompt: string, context: OpsContext) {
    if (loading) return;
    setActiveTask(task);
    setProposedId(null);
    const userMessage: DisplayMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: prompt,
    };
    const history: OpsMessage[] = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: prompt },
    ];
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      await streamOpsAi({
        task,
        context,
        messages: history,
        onChunk: (text) =>
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m))
          ),
      });
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  "Something went wrong. Check the connection and try again.",
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function runQuickAction(action: QuickAction) {
    const businessDate = useOpsClockStore.getState().businessDate;
    const built = action.build(businessDate);
    const kind = PROPOSAL_KIND_BY_TASK[action.task];
    setPendingAction(
      kind && built.targetRef
        ? { kind, targetRef: built.targetRef, fallback: built.fallback }
        : null
    );
    void send(action.task, action.prompt, built.context);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const businessDate = useOpsClockStore.getState().businessDate;
    // Free-text questions reuse the active task and its grounding context.
    const action =
      QUICK_ACTIONS.find((a) => a.task === activeTask) ?? QUICK_ACTIONS[0];
    const built = action.build(businessDate);
    setInput("");
    void send(activeTask, trimmed, built.context);
  }

  function sendToApprovals() {
    if (!pendingAction) return;
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    const summary =
      (lastAssistant && extractProposedAction(lastAssistant.content)) ||
      pendingAction.fallback;
    addProposal({
      kind: pendingAction.kind,
      summary,
      targetRef: pendingAction.targetRef,
    });
    setProposedId(pendingAction.targetRef);
  }

  const canPropose =
    pendingAction !== null &&
    !loading &&
    messages.some((m) => m.role === "assistant" && m.content.length > 0);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Sparkles className="text-brand-green" />
        <span className="hidden sm:inline">Ask Capital AI</span>
        <span className="sm:hidden">AI</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles size={16} className="text-brand-green" />
              Capital AI ops copilot
            </SheetTitle>
            <SheetDescription>
              I explain and propose. A human checker approves every action in the
              approvals queue.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Pick a quick action or ask about settlement, reconciliation,
                  treasury or compliance.
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => runQuickAction(action)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground"
                  }`}
                >
                  {msg.content || (
                    <span className="animate-pulse opacity-50">Thinking...</span>
                  )}
                </div>
              </div>
            ))}

            {canPropose ? (
              <div className="rounded-lg border bg-card p-3">
                {proposedId === pendingAction?.targetRef ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <Check size={14} />
                    Sent to approvals. A human checker must approve it before
                    anything changes.
                  </span>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      Hand this proposed action to the maker-checker queue.
                    </span>
                    <Button
                      size="xs"
                      className="bg-brand-green text-brand-cream hover:bg-brand-green-light"
                      onClick={sendToApprovals}
                    >
                      <Send />
                      Send to approvals
                    </Button>
                  </div>
                )}
              </div>
            ) : null}

            {messages.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => runQuickAction(action)}
                    disabled={loading}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the ops copilot..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send size={16} />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
