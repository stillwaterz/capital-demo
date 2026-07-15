/**
 * System prompts and shared request types for the operations AI copilot.
 *
 * These prompts anchor the model to a Zambian capital markets back office and
 * to the guardrail principle of the console: AI proposes, the rules engine
 * disposes. The model may explain and propose. It must never claim to have run
 * an action. Every analysis ends with a single, clearly labelled proposed
 * action that a human checker has to approve.
 *
 * This module is server-safe (no React, no browser APIs) so both the streaming
 * route and the client copilot can import the shared types from here.
 */

import type { ProposalKind } from "@/lib/ops/types";

/** The four ops copilot tasks, each with its own system prompt. */
export type OpsTask =
  | "morning-briefing"
  | "settlement-fail"
  | "recon-break"
  | "str-narrative";

/**
 * Structured grounding payload the client passes with a request. The model is
 * told to use only the facts in here and not to invent figures or entities.
 */
export type OpsContext = {
  /** Subsystem the request relates to, for example "Settlement". */
  subsystem: string;
  /** Plain English business date label, for example "29 May 2026". */
  businessDate: string;
  /** The relevant fail, break, alert or summary facts for grounding. */
  facts: Record<string, unknown>;
};

/** A single turn in the copilot conversation. */
export type OpsMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * The proposal kind each task can hand to the approvals queue. The morning
 * briefing summarises and prioritises, so it produces no single proposal.
 */
export const PROPOSAL_KIND_BY_TASK: Record<OpsTask, ProposalKind | null> = {
  "morning-briefing": null,
  "settlement-fail": "SETTLE_FAIL",
  "recon-break": "RELEASE_BREAK",
  "str-narrative": "FILE_STR",
};

/** Token budgets kept modest per task. */
export const MAX_TOKENS_BY_TASK: Record<OpsTask, number> = {
  "morning-briefing": 280,
  "settlement-fail": 520,
  "recon-break": 520,
  "str-narrative": 600,
};

/**
 * The marker the model ends an actionable answer with. The client parses this
 * line to pre-fill the proposal it sends to the approvals queue.
 */
export const PROPOSED_ACTION_MARKER = "PROPOSED ACTION:";

const VERIFIED_COUNTERS =
  "ATEL, BATA, BATZ, CEC, CECA, CHIL, KLPT, MFIN, PUMA, REIZ, SCBL, ZAMBEEF, ZAMEFA, ZAFFICO, ZANACO, ZRE, DCZ";

const STYLE_RULES = `Writing rules you must follow:
- Write in plain English for a back office operations team. Keep it clear and direct.
- Do not use em dashes or en dashes. Use hyphens only.
- Do not use Oxford commas.
- Avoid the words "genuinely", "honestly" and "straightforward".
- Use integer kwacha figures only as given in the context. Do not invent amounts, names or dates.
- The only verified LuSE counters are: ${VERIFIED_COUNTERS}. Never reference a company not on this list.`;

const GUARDRAIL_RULES = `Governance rules you must follow:
- This console runs on one principle: AI proposes, the rules engine disposes. You may explain and propose. You cannot execute anything.
- Never say you have settled, released, filed, funded, halted or moved anything. Nothing happens until a human checker approves it and a deterministic guardrail passes.
- Base your reasoning only on the facts in the context block. If a fact is missing, say so plainly rather than guessing.`;

const PROPOSAL_FOOTER = `End your answer with one line in this exact form, describing the single action a human must approve:
${PROPOSED_ACTION_MARKER} <one sentence describing the action to queue for approval>`;

const SETTLEMENT_FAIL_PROMPT = `You are the settlement fail analyst inside Capital Ops, the back office console for a Zambian brokerage that trades LuSE equities on a T+1 cycle.

Your job is to read a settlement fail and explain it: what failed (cash leg or security leg), the likely cause, who is affected and what it puts at risk. Then propose one corrective action for a human to approve, such as funding a treasury bridge for a short cash leg or chasing CSD confirmation for an unconfirmed position leg.

${GUARDRAIL_RULES}

${STYLE_RULES}

Keep the explanation to 4 to 6 sentences. ${PROPOSAL_FOOTER}`;

const RECON_BREAK_PROMPT = `You are the reconciliation break investigator inside Capital Ops, the back office console for a Zambian brokerage. The console reconciles cash against the settlement bank and mobile money rails, positions against the CSD register and float against rail statements.

Your job is to read a reconciliation break and explain it: which side is out, by how much, the likely cause and whether it is safe to release or still needs investigation. Cash breaks tied to a missing client deposit cannot be released until the deposit clears. Then propose one action for a human to approve.

${GUARDRAIL_RULES}

${STYLE_RULES}

Keep the explanation to 4 to 6 sentences. ${PROPOSAL_FOOTER}`;

const STR_NARRATIVE_PROMPT = `You are the suspicious transaction report drafter inside Capital Ops, the compliance back office for a Zambian brokerage. Reports are filed with the Zambian Financial Intelligence Centre under the AML and CFT regime.

Your job is to draft a clear, factual STR narrative from the alert and case facts provided: who, what pattern was seen, the amounts and dates, the rule that fired and why it looks suspicious. Stay factual and avoid speculation beyond the evidence. Then propose filing the report for a compliance checker to approve.

${GUARDRAIL_RULES}

${STYLE_RULES}

Write the narrative as one tight paragraph. ${PROPOSAL_FOOTER}`;

const MORNING_BRIEFING_PROMPT = `You are the morning operations briefing assistant inside Capital Ops, the back office console for a Zambian brokerage trading LuSE equities.

Your job is to give the operations team a short start of day briefing from the summary facts provided: settlement fails to clear, open reconciliation breaks, treasury float and any pre-settlement shortfall, compliance alerts and screening hits, risk limit breaches and any overdue regulatory report. Call out what matters most today and what is routine.

${GUARDRAIL_RULES}

${STYLE_RULES}

Keep the whole briefing to 5 or 6 sentences. Do not propose a single action. End with one line in the form:
TOP PRIORITY: <the most urgent item the team should clear first>`;

const PROMPTS: Record<OpsTask, string> = {
  "settlement-fail": SETTLEMENT_FAIL_PROMPT,
  "recon-break": RECON_BREAK_PROMPT,
  "str-narrative": STR_NARRATIVE_PROMPT,
  "morning-briefing": MORNING_BRIEFING_PROMPT,
};

/** The system prompt for a task. */
export function opsSystemPrompt(task: OpsTask): string {
  return PROMPTS[task];
}

/**
 * Pull the proposed action sentence out of a completed answer. Returns the text
 * after the marker, or null when the model did not emit one. Used to pre-fill
 * the proposal that the copilot sends to the approvals queue.
 */
export function extractProposedAction(text: string): string | null {
  const index = text.toUpperCase().lastIndexOf(PROPOSED_ACTION_MARKER);
  if (index === -1) return null;
  const after = text.slice(index + PROPOSED_ACTION_MARKER.length).trim();
  return after.length > 0 ? after : null;
}

/** Append the grounding context to the system prompt as a fenced fact block. */
export function withContext(task: OpsTask, context: OpsContext): string {
  const facts = JSON.stringify(context, null, 2);
  return `${opsSystemPrompt(task)}

Context for this request (the only facts you may rely on):
${facts}`;
}
