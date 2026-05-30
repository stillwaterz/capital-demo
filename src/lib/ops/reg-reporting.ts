/**
 * Regulatory reporting register for the operations console.
 *
 * Tracks the returns owed to the four Zambian bodies the brokerage answers to:
 * the Securities and Exchange Commission (SEC), the Bank of Zambia (BoZ), the
 * Financial Intelligence Centre (FIC) and the Lusaka Securities Exchange (LuSE).
 *
 * Deterministic seed data. Due dates are ISO calendar strings and statuses are
 * seeded; helpers recompute due and overdue state relative to the business
 * clock so the register stays honest as the demo advances.
 */

import type { IsoDate, RegBody, RegReport, ReportStatus } from "./types";
import { DEMO_TODAY, isBefore } from "./clock";

const TENANT_ID = "tenant-capital";

export const REG_BODY_NAMES: Record<RegBody, string> = {
  SEC: "Securities and Exchange Commission",
  BOZ: "Bank of Zambia",
  FIC: "Financial Intelligence Centre",
  LUSE: "Lusaka Securities Exchange",
};

/**
 * Register of submissions across the four regulators. The mix of statuses is
 * deliberate: one FIC return is overdue and several are due against the current
 * business date for the demo narrative.
 */
export const REG_REPORTS: readonly RegReport[] = [
  {
    id: "reg-sec-001",
    tenantId: TENANT_ID,
    body: "SEC",
    name: "Quarterly capital adequacy return",
    period: "2026-Q1",
    dueDate: "2026-04-30",
    status: "ACCEPTED",
    submittedAt: "2026-04-28T10:00:00.000Z",
  },
  {
    id: "reg-sec-002",
    tenantId: TENANT_ID,
    body: "SEC",
    name: "Monthly client asset segregation return",
    period: "2026-04",
    dueDate: "2026-05-15",
    status: "SUBMITTED",
    submittedAt: "2026-05-14T16:20:00.000Z",
  },
  {
    id: "reg-boz-003",
    tenantId: TENANT_ID,
    body: "BOZ",
    name: "Monthly prudential return",
    period: "2026-04",
    dueDate: "2026-05-20",
    status: "ACCEPTED",
    submittedAt: "2026-05-19T09:45:00.000Z",
  },
  {
    id: "reg-boz-004",
    tenantId: TENANT_ID,
    body: "BOZ",
    name: "AML and CFT compliance return",
    period: "2026-Q1",
    dueDate: "2026-05-31",
    status: "DRAFT",
    submittedAt: null,
  },
  {
    id: "reg-fic-005",
    tenantId: TENANT_ID,
    body: "FIC",
    name: "Cash threshold report batch",
    period: "2026-05",
    dueDate: "2026-05-25",
    status: "OVERDUE",
    submittedAt: null,
  },
  {
    id: "reg-fic-006",
    tenantId: TENANT_ID,
    body: "FIC",
    name: "Monthly suspicious transaction summary",
    period: "2026-04",
    dueDate: "2026-05-10",
    status: "ACCEPTED",
    submittedAt: "2026-05-09T11:30:00.000Z",
  },
  {
    id: "reg-luse-007",
    tenantId: TENANT_ID,
    body: "LUSE",
    name: "Daily trade reconciliation file",
    period: "2026-05-28",
    dueDate: "2026-05-29",
    status: "DUE",
    submittedAt: null,
  },
  {
    id: "reg-luse-008",
    tenantId: TENANT_ID,
    body: "LUSE",
    name: "Monthly trading member return",
    period: "2026-04",
    dueDate: "2026-05-07",
    status: "ACCEPTED",
    submittedAt: "2026-05-06T08:15:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export function getReportsByBody(body: RegBody): RegReport[] {
  return REG_REPORTS.filter((report) => report.body === body);
}

export function getReportById(id: string): RegReport | undefined {
  return REG_REPORTS.find((report) => report.id === id);
}

const PENDING_STATUSES: readonly ReportStatus[] = ["DRAFT", "DUE", "OVERDUE"];

/** A report is outstanding when it has not yet been submitted or accepted. */
export function isOutstanding(report: RegReport): boolean {
  return PENDING_STATUSES.includes(report.status);
}

/**
 * Reports that are overdue. Combines the seeded OVERDUE status with any
 * outstanding return whose due date is before the given business date.
 */
export function getOverdueReports(today: IsoDate = DEMO_TODAY): RegReport[] {
  return REG_REPORTS.filter(
    (report) =>
      report.status === "OVERDUE" ||
      (isOutstanding(report) && isBefore(report.dueDate, today))
  );
}

/** Outstanding reports due on or after the business date, soonest first. */
export function getUpcomingReports(today: IsoDate = DEMO_TODAY): RegReport[] {
  return REG_REPORTS.filter(
    (report) => isOutstanding(report) && !isBefore(report.dueDate, today)
  ).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export type RegReportingSummary = {
  total: number;
  outstanding: number;
  overdue: number;
  submitted: number;
  accepted: number;
  byBody: Record<RegBody, number>;
  byStatus: Record<ReportStatus, number>;
};

const REG_BODIES: readonly RegBody[] = ["SEC", "BOZ", "FIC", "LUSE"];

const REPORT_STATUSES: readonly ReportStatus[] = [
  "DRAFT",
  "DUE",
  "SUBMITTED",
  "ACCEPTED",
  "OVERDUE",
];

export function regReportingSummary(
  today: IsoDate = DEMO_TODAY
): RegReportingSummary {
  const byBody = REG_BODIES.reduce<Record<RegBody, number>>(
    (acc, body) => {
      acc[body] = getReportsByBody(body).length;
      return acc;
    },
    { SEC: 0, BOZ: 0, FIC: 0, LUSE: 0 }
  );

  const byStatus = REPORT_STATUSES.reduce<Record<ReportStatus, number>>(
    (acc, status) => {
      acc[status] = REG_REPORTS.filter((r) => r.status === status).length;
      return acc;
    },
    { DRAFT: 0, DUE: 0, SUBMITTED: 0, ACCEPTED: 0, OVERDUE: 0 }
  );

  return {
    total: REG_REPORTS.length,
    outstanding: REG_REPORTS.filter(isOutstanding).length,
    overdue: getOverdueReports(today).length,
    submitted: byStatus.SUBMITTED,
    accepted: byStatus.ACCEPTED,
    byBody,
    byStatus,
  };
}
