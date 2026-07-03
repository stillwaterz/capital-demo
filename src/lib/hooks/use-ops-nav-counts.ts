"use client";

import { useMemo } from "react";
import { useOpsClockStore } from "@/lib/store/ops-clock";
import { useCustomerOrdersStore } from "@/lib/store/customer-orders";
import { useOpsGovernanceStore } from "@/lib/store/ops-governance";
import { customerOrderToTrade } from "@/lib/ops/customer-trades";
import { settlementSummary } from "@/lib/ops/settlement";
import { reconSummary } from "@/lib/ops/reconciliation";
import { complianceSummary } from "@/lib/ops/compliance";
import { kycSummary } from "@/lib/ops/kyc-queue";
import { regReportingSummary } from "@/lib/ops/reg-reporting";

export type OpsNavCounts = {
  orders: number;
  settlementFails: number;
  reconBreaks: number;
  pendingApprovals: number;
  openAlerts: number;
  kycInReview: number;
  overdueReports: number;
  attentionTotal: number;
};

/** Live badge counts for ops navigation and the status bar. */
export function useOpsNavCounts(): OpsNavCounts {
  const businessDate = useOpsClockStore((s) => s.businessDate);
  const orders = useCustomerOrdersStore((s) => s.orders);
  const proposals = useOpsGovernanceStore((s) => s.proposals);

  return useMemo(() => {
    const extraTrades = orders.map((o) => customerOrderToTrade(o, businessDate));
    const settlement = settlementSummary(businessDate, extraTrades);
    const recon = reconSummary(businessDate);
    const compliance = complianceSummary();
    const kyc = kycSummary();
    const reporting = regReportingSummary(businessDate);
    const pendingApprovals = proposals.filter((p) => p.status === "PENDING").length;

    const attentionTotal =
      settlement.failCount +
      recon.openBreaks +
      pendingApprovals +
      compliance.openAlerts +
      kyc.inReview +
      reporting.overdue;

    return {
      orders: orders.length,
      settlementFails: settlement.failCount,
      reconBreaks: recon.openBreaks,
      pendingApprovals,
      openAlerts: compliance.openAlerts,
      kycInReview: kyc.inReview,
      overdueReports: reporting.overdue,
      attentionTotal,
    };
  }, [businessDate, orders, proposals]);
}
