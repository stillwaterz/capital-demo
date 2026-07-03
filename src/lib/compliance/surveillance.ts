/**
 * Deterministic AML transaction-surveillance rules for the compliance agent.
 *
 * Every rule is a pure function over ledger entries. Each returns reason-coded,
 * explainable findings so the compliance agent can show a plain-English case for
 * why an alert fired. Money is integer ngwee throughout, never a float. The
 * framing follows the Zambian Financial Intelligence Centre (FIC) AML/CFT regime.
 *
 * The AI proposes, the rules engine disposes: these rules are the deterministic
 * layer that turns raw ledger movements into auditable alerts. Thresholds and
 * windows are exported named constants so they can be reviewed.
 */

import type { AlertSeverity, AlertType, Ngwee } from "@/lib/ops/types";
import type { LedgerEntryRow } from "@/lib/db/types";

// ---------------------------------------------------------------------------
// Time constants (kept as named parts so no magic numbers leak into windows)
// ---------------------------------------------------------------------------

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MS_PER_HOUR = MS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
const MS_PER_DAY = MS_PER_HOUR * HOURS_PER_DAY;

const NGWEE_PER_KWACHA = 100;

// ---------------------------------------------------------------------------
// Auditable thresholds and windows
// ---------------------------------------------------------------------------

/** Large single-value reporting threshold, in ngwee (ZMW 150,000). */
export const LARGE_VALUE_THRESHOLD_NGWEE: Ngwee = 15_000_000;

/** A single transaction at or above this multiple of the threshold is critical. */
export const THRESHOLD_CRITICAL_MULTIPLE = 2;

/** Rolling window for the velocity rule, in whole hours. */
export const VELOCITY_WINDOW_HOURS = 1;

/** Rolling window for the velocity rule, in milliseconds. */
export const VELOCITY_WINDOW_MS = VELOCITY_WINDOW_HOURS * MS_PER_HOUR;

/** Transactions inside the window at or above this count raise a velocity alert. */
export const VELOCITY_MAX_COUNT = 10;

/** Velocity counts at or above this bound are treated as high severity. */
export const VELOCITY_HIGH_COUNT = 20;

/** Rolling window for the structuring rule, in whole days. */
export const STRUCTURING_WINDOW_DAYS = 3;

/** Rolling window for the structuring rule, in milliseconds. */
export const STRUCTURING_WINDOW_MS = STRUCTURING_WINDOW_DAYS * MS_PER_DAY;

/** Smallest count of sub-threshold transactions that can form a structuring cluster. */
export const STRUCTURING_MIN_COUNT = 3;

/**
 * Floor of the sub-threshold band, in ngwee (ZMW 100,000). Transactions between
 * this floor and the reporting threshold are "just under" the threshold and are
 * the classic smurfing pattern.
 */
export const STRUCTURING_BAND_FLOOR_NGWEE: Ngwee = 10_000_000;

// ---------------------------------------------------------------------------
// Reason codes (stable, machine-readable, one per detected pattern)
// ---------------------------------------------------------------------------

export const REASON_LARGE_SINGLE_TXN = "AML_LARGE_SINGLE_TXN";
export const REASON_THRESHOLD_BREACH = "AML_REPORTING_THRESHOLD_BREACH";
export const REASON_HIGH_VELOCITY = "AML_HIGH_TXN_VELOCITY";
export const REASON_FUNNEL_PATTERN = "AML_FUNNEL_ACCOUNT";
export const REASON_STRUCTURING = "AML_STRUCTURING_SMURFING";
export const REASON_SUB_THRESHOLD_CLUSTER = "AML_SUB_THRESHOLD_CLUSTER";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A reason-coded, explainable finding produced by a single surveillance rule. */
export type SurveillanceFinding = {
  type: AlertType;
  severity: AlertSeverity;
  reasonCodes: string[];
  description: string;
  amountNgwee: Ngwee | null;
};

/**
 * An alert ready to persist. Shape matches ComplianceAlertRow minus the
 * database-generated fields (id, tenant_id, mlro_action, created_at, updated_at).
 * Always opens in the OPEN state for MLRO review.
 */
export type SurveillanceAlert = {
  type: AlertType;
  severity: AlertSeverity;
  account_id: string;
  reason_codes: string[];
  description: string;
  amount_ngwee: Ngwee | null;
  status: "OPEN";
};

/** The densest cluster of entries found inside a rolling time window. */
type WindowCluster = {
  count: number;
  sumNgwee: Ngwee;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeOf(entry: LedgerEntryRow): number {
  return Date.parse(entry.created_at);
}

function sortByTime(entries: readonly LedgerEntryRow[]): LedgerEntryRow[] {
  return [...entries].sort((a, b) => timeOf(a) - timeOf(b));
}

function formatNgwee(amount: Ngwee): string {
  const kwacha = Math.trunc(amount / NGWEE_PER_KWACHA);
  const grouped = kwacha.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `ZMW ${grouped}`;
}

/**
 * Find the densest rolling window across the entries. Anchors a window of
 * windowMs at each entry in time order and returns the count and summed value of
 * the fullest window.
 */
function densestWindow(
  entries: readonly LedgerEntryRow[],
  windowMs: number
): WindowCluster {
  const sorted = sortByTime(entries);
  let best: WindowCluster = { count: 0, sumNgwee: 0 };
  for (let start = 0; start < sorted.length; start += 1) {
    const limit = timeOf(sorted[start]) + windowMs;
    let count = 0;
    let sumNgwee = 0;
    for (let i = start; i < sorted.length && timeOf(sorted[i]) <= limit; i += 1) {
      count += 1;
      sumNgwee += sorted[i].amount_ngwee;
    }
    if (count > best.count) best = { count, sumNgwee };
  }
  return best;
}

// ---------------------------------------------------------------------------
// Rules (each pure, each returns reason-coded findings)
// ---------------------------------------------------------------------------

/** THRESHOLD: any single transaction at or above the large-value threshold. */
export function detectThreshold(
  entries: readonly LedgerEntryRow[]
): SurveillanceFinding[] {
  const criticalAt = LARGE_VALUE_THRESHOLD_NGWEE * THRESHOLD_CRITICAL_MULTIPLE;
  return entries
    .filter((entry) => entry.amount_ngwee >= LARGE_VALUE_THRESHOLD_NGWEE)
    .map((entry) => ({
      type: "THRESHOLD" as const,
      severity: (entry.amount_ngwee >= criticalAt ? "CRITICAL" : "HIGH") as AlertSeverity,
      reasonCodes: [REASON_LARGE_SINGLE_TXN, REASON_THRESHOLD_BREACH],
      description: `Single transaction of ${formatNgwee(entry.amount_ngwee)} at or above the ${formatNgwee(LARGE_VALUE_THRESHOLD_NGWEE)} reporting threshold. Source of funds review required.`,
      amountNgwee: entry.amount_ngwee,
    }));
}

/** VELOCITY: too many transactions from one account inside a short window. */
export function detectVelocity(
  entries: readonly LedgerEntryRow[]
): SurveillanceFinding[] {
  if (entries.length < VELOCITY_MAX_COUNT) return [];
  const cluster = densestWindow(entries, VELOCITY_WINDOW_MS);
  if (cluster.count < VELOCITY_MAX_COUNT) return [];
  const severity: AlertSeverity =
    cluster.count >= VELOCITY_HIGH_COUNT ? "HIGH" : "MEDIUM";
  return [
    {
      type: "VELOCITY",
      severity,
      reasonCodes: [REASON_HIGH_VELOCITY, REASON_FUNNEL_PATTERN],
      description: `${cluster.count} transactions inside ${VELOCITY_WINDOW_HOURS} hour totalling ${formatNgwee(cluster.sumNgwee)}. Rate far above normal account behaviour, consistent with funnel activity.`,
      amountNgwee: cluster.sumNgwee,
    },
  ];
}

/** STRUCTURING: a cluster of just-under-threshold transactions summing past it. */
export function detectStructuring(
  entries: readonly LedgerEntryRow[]
): SurveillanceFinding[] {
  const band = entries.filter(
    (entry) =>
      entry.amount_ngwee >= STRUCTURING_BAND_FLOOR_NGWEE &&
      entry.amount_ngwee < LARGE_VALUE_THRESHOLD_NGWEE
  );
  if (band.length < STRUCTURING_MIN_COUNT) return [];
  const cluster = densestWindow(band, STRUCTURING_WINDOW_MS);
  if (
    cluster.count < STRUCTURING_MIN_COUNT ||
    cluster.sumNgwee < LARGE_VALUE_THRESHOLD_NGWEE
  ) {
    return [];
  }
  return [
    {
      type: "STRUCTURING",
      severity: "HIGH",
      reasonCodes: [REASON_STRUCTURING, REASON_SUB_THRESHOLD_CLUSTER],
      description: `${cluster.count} transactions each just under the ${formatNgwee(LARGE_VALUE_THRESHOLD_NGWEE)} threshold within ${STRUCTURING_WINDOW_DAYS} days, totalling ${formatNgwee(cluster.sumNgwee)}. Pattern consistent with structuring to avoid reporting.`,
      amountNgwee: cluster.sumNgwee,
    },
  ];
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

function groupByAccount(
  entries: readonly LedgerEntryRow[]
): Map<string, LedgerEntryRow[]> {
  const byAccount = new Map<string, LedgerEntryRow[]>();
  for (const entry of entries) {
    const bucket = byAccount.get(entry.account_id);
    if (bucket) bucket.push(entry);
    else byAccount.set(entry.account_id, [entry]);
  }
  return byAccount;
}

function toAlert(
  accountId: string,
  finding: SurveillanceFinding
): SurveillanceAlert {
  return {
    type: finding.type,
    severity: finding.severity,
    account_id: accountId,
    reason_codes: finding.reasonCodes,
    description: finding.description,
    amount_ngwee: finding.amountNgwee,
    status: "OPEN",
  };
}

/**
 * Run every surveillance rule across all accounts and return the raised alerts.
 * Entries are grouped by account so each rule only ever sees one account at a
 * time. Every returned alert carries reason codes and a plain-English case.
 */
export function runSurveillance(
  entries: readonly LedgerEntryRow[]
): SurveillanceAlert[] {
  const alerts: SurveillanceAlert[] = [];
  for (const [accountId, accountEntries] of groupByAccount(entries)) {
    const findings = [
      ...detectThreshold(accountEntries),
      ...detectVelocity(accountEntries),
      ...detectStructuring(accountEntries),
    ];
    for (const finding of findings) alerts.push(toAlert(accountId, finding));
  }
  return alerts;
}
