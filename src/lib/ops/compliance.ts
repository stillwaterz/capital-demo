/**
 * AML transaction-monitoring, sanctions and PEP screening, and STR/SAR case
 * engine for the operations console.
 *
 * Deterministic seed data only. Every figure is integer ngwee. The screening
 * framing follows the Zambian Financial Intelligence Centre (FIC) AML/CFT
 * regime and the standard consolidated sanctions sources (OFAC, UN, EU, UK).
 *
 * Downstream AI and governance workers import the selectors below to build STR
 * narratives and maker-checker proposals. They should not redefine these types.
 */

import type {
  AlertSeverity,
  AlertStatus,
  AlertType,
  ComplianceAlert,
  IsoTimestamp,
  Ngwee,
  StrCase,
} from "./types";

const TENANT_ID = "tenant-capital";

/** Cash transaction reporting threshold used by the monitoring rules, in ngwee. */
export const CASH_REPORTING_THRESHOLD_NGWEE: Ngwee = 15_000_000; // ZMW 150,000

/**
 * Seed AML transaction-monitoring alerts. Covers the five monitored alert
 * types, with at least one structuring case and one sanctions hit and one PEP
 * hit for the demo narrative.
 */
export const COMPLIANCE_ALERTS: readonly ComplianceAlert[] = [
  {
    id: "alert-thr-001",
    tenantId: TENANT_ID,
    type: "THRESHOLD",
    severity: "HIGH",
    clientId: "cust-sakala",
    clientName: "Emmanuel Sakala",
    description:
      "Single bank deposit of ZMW 150,000 met the FIC large cash transaction reporting threshold. Source of funds note outstanding.",
    amountNgwee: 15_000_000,
    status: "OPEN",
    raisedAt: "2026-05-28T07:42:00.000Z",
  },
  {
    id: "alert-vel-002",
    tenantId: TENANT_ID,
    type: "VELOCITY",
    severity: "MEDIUM",
    clientId: "cust-tembo",
    clientName: "Natasha Tembo",
    description:
      "22 mobile money transfers totalling ZMW 86,000 inside 24 hours, well above the account 30-day average. Possible funnel activity.",
    amountNgwee: 8_600_000,
    status: "REVIEWING",
    raisedAt: "2026-05-28T11:05:00.000Z",
  },
  {
    id: "alert-str-003",
    tenantId: TENANT_ID,
    type: "STRUCTURING",
    severity: "HIGH",
    clientId: "cust-zulu",
    clientName: "Joseph Zulu",
    description:
      "Four deposits of ZMW 9,500 across three days, each kept just under the ZMW 10,000 Tier 1 monthly ceiling. Pattern consistent with structuring to avoid limits.",
    amountNgwee: 3_800_000,
    status: "ESCALATED",
    raisedAt: "2026-05-27T15:20:00.000Z",
  },
  {
    id: "alert-san-004",
    tenantId: TENANT_ID,
    type: "SANCTIONS",
    severity: "CRITICAL",
    clientId: "cust-makumba",
    clientName: "Victor Makumba",
    description:
      "Inbound diaspora transfer payer name matched a UN and OFAC consolidated sanctions list entry at 92 percent confidence. Funds held pending manual disposition.",
    amountNgwee: 4_500_000,
    status: "ESCALATED",
    raisedAt: "2026-05-29T06:10:00.000Z",
  },
  {
    id: "alert-pep-005",
    tenantId: TENANT_ID,
    type: "PEP",
    severity: "HIGH",
    clientId: "cust-kapembwa",
    clientName: "Royd Kapembwa",
    description:
      "Client matched a domestic politically exposed person record (provincial permanent secretary). Enhanced due diligence and source of wealth review required before Tier 2 funding.",
    amountNgwee: 32_000_000,
    status: "REVIEWING",
    raisedAt: "2026-05-26T09:30:00.000Z",
  },
  {
    id: "alert-thr-006",
    tenantId: TENANT_ID,
    type: "THRESHOLD",
    severity: "LOW",
    clientId: "cust-lungu",
    clientName: "Grace Lungu",
    description:
      "Deposit of ZMW 142,000 sat just below the cash reporting threshold. Reviewed against history and cleared as a property sale settlement.",
    amountNgwee: 14_200_000,
    status: "CLEARED",
    raisedAt: "2026-05-25T13:48:00.000Z",
  },
  {
    id: "alert-vel-007",
    tenantId: TENANT_ID,
    type: "VELOCITY",
    severity: "LOW",
    clientId: "cust-mwansa",
    clientName: "Kelvin Mwansa",
    description:
      "Burst of nine small top-ups ahead of a T-bill auction. Reviewed and cleared as ordinary pre-auction funding behaviour.",
    amountNgwee: 1_750_000,
    status: "CLEARED",
    raisedAt: "2026-05-24T08:12:00.000Z",
  },
];

/**
 * STR/SAR cases routed to the FIC. Each is built from one or more source
 * alerts and carries a drafted narrative for the suspicious transaction report.
 */
export const STR_CASES: readonly StrCase[] = [
  {
    id: "str-001",
    tenantId: TENANT_ID,
    clientId: "cust-zulu",
    clientName: "Joseph Zulu",
    alertIds: ["alert-str-003"],
    narrative:
      "Client made four mobile money deposits of ZMW 9,500 over three days, each deliberately below the ZMW 10,000 Tier 1 monthly ceiling and the cash reporting threshold. No commercial rationale provided. Activity is consistent with structuring to evade transaction limits and reporting. Report drafted for filing with the Financial Intelligence Centre.",
    status: "DRAFT",
    openedAt: "2026-05-27T16:00:00.000Z",
    filedAt: null,
  },
  {
    id: "str-002",
    tenantId: TENANT_ID,
    clientId: "cust-makumba",
    clientName: "Victor Makumba",
    alertIds: ["alert-san-004"],
    narrative:
      "Inbound diaspora transfer of ZMW 45,000 from a payer matching a UN and OFAC consolidated sanctions entry. Funds frozen on receipt and not credited to the wallet. Report filed with the Financial Intelligence Centre and account suspended pending guidance.",
    status: "FILED",
    openedAt: "2026-05-29T06:30:00.000Z",
    filedAt: "2026-05-29T08:15:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** Alerts that still need attention (not cleared). */
export function getOpenAlerts(): ComplianceAlert[] {
  return COMPLIANCE_ALERTS.filter((alert) => alert.status !== "CLEARED");
}

export function getAlertsByType(type: AlertType): ComplianceAlert[] {
  return COMPLIANCE_ALERTS.filter((alert) => alert.type === type);
}

export function getAlertById(id: string): ComplianceAlert | undefined {
  return COMPLIANCE_ALERTS.find((alert) => alert.id === id);
}

/** Sanctions and PEP screening hits, surfaced as their own watch queue. */
export function getScreeningHits(): ComplianceAlert[] {
  return COMPLIANCE_ALERTS.filter(
    (alert) => alert.type === "SANCTIONS" || alert.type === "PEP"
  );
}

export function getStrCases(): StrCase[] {
  return [...STR_CASES];
}

export function getStrCaseById(id: string): StrCase | undefined {
  return STR_CASES.find((strCase) => strCase.id === id);
}

export type ComplianceSummary = {
  totalAlerts: number;
  openAlerts: number;
  escalatedAlerts: number;
  criticalAlerts: number;
  screeningHits: number;
  strDraft: number;
  strFiled: number;
  byStatus: Record<AlertStatus, number>;
  bySeverity: Record<AlertSeverity, number>;
};

const ALERT_STATUSES: readonly AlertStatus[] = [
  "OPEN",
  "REVIEWING",
  "CLEARED",
  "ESCALATED",
];

const ALERT_SEVERITIES: readonly AlertSeverity[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

/** Headline counts for the compliance dashboard. */
export function complianceSummary(): ComplianceSummary {
  const byStatus = ALERT_STATUSES.reduce<Record<AlertStatus, number>>(
    (acc, status) => {
      acc[status] = COMPLIANCE_ALERTS.filter(
        (alert) => alert.status === status
      ).length;
      return acc;
    },
    { OPEN: 0, REVIEWING: 0, CLEARED: 0, ESCALATED: 0 }
  );

  const bySeverity = ALERT_SEVERITIES.reduce<Record<AlertSeverity, number>>(
    (acc, severity) => {
      acc[severity] = COMPLIANCE_ALERTS.filter(
        (alert) => alert.severity === severity
      ).length;
      return acc;
    },
    { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
  );

  return {
    totalAlerts: COMPLIANCE_ALERTS.length,
    openAlerts: getOpenAlerts().length,
    escalatedAlerts: byStatus.ESCALATED,
    criticalAlerts: bySeverity.CRITICAL,
    screeningHits: getScreeningHits().length,
    strDraft: STR_CASES.filter((c) => c.status === "DRAFT").length,
    strFiled: STR_CASES.filter((c) => c.status === "FILED").length,
    byStatus,
    bySeverity,
  };
}

/** Convenience accessor mirroring the other engines. */
export function raisedAtIso(alert: ComplianceAlert): IsoTimestamp {
  return alert.raisedAt;
}
