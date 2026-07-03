import {
  AlertCircle,
  AlertTriangle,
  FileText,
  Radar,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  OpsPage,
  PageHeading,
  SectionCard,
  StatCard,
  StatGrid,
} from "@/components/ops/ops-kit";
import { AlertStatusBadge, SeverityBadge } from "@/components/ops/ops-badges";
import {
  COMPLIANCE_ALERTS,
  complianceSummary,
  getScreeningHits,
  getStrCases,
} from "@/lib/ops/compliance";
import { formatZMW } from "@/lib/format";
import { formatDateZM } from "@/lib/format";
import { DEMO_TODAY } from "@/lib/ops/clock";
import { AskAiButton } from "@/components/ops/ask-ai-button";
import { SurveillancePanel } from "@/components/ops/surveillance-panel";
import { ProposeActionButton } from "@/components/ops/propose-action-button";

function formatAmount(amountNgwee: number | null): string {
  return amountNgwee === null ? "-" : formatZMW(amountNgwee);
}

export default function CompliancePage() {
  const summary = complianceSummary();
  const screeningHits = getScreeningHits();
  const strCases = getStrCases();

  return (
    <OpsPage>
      <PageHeading
        title="Compliance"
        description="AML transaction monitoring, sanctions and PEP screening, and STR cases routed to the Financial Intelligence Centre."
      />

      <StatGrid columns={5}>
        <StatCard
          label="Open alerts"
          value={String(summary.openAlerts)}
          hint={`${summary.totalAlerts} total`}
          icon={AlertTriangle}
          tone={summary.openAlerts > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Escalated"
          value={String(summary.escalatedAlerts)}
          tone={summary.escalatedAlerts > 0 ? "danger" : "neutral"}
          icon={AlertCircle}
        />
        <StatCard
          label="Critical"
          value={String(summary.criticalAlerts)}
          tone={summary.criticalAlerts > 0 ? "danger" : "neutral"}
          icon={AlertTriangle}
        />
        <StatCard
          label="Screening hits"
          value={String(summary.screeningHits)}
          hint="Sanctions and PEP"
          icon={Radar}
        />
        <StatCard
          label="STR cases"
          value={String(strCases.length)}
          hint={`${summary.strFiled} filed, ${summary.strDraft} draft`}
          icon={FileText}
        />
      </StatGrid>

      <SectionCard
        title="Transaction monitoring alerts"
        icon={Shield}
        description="Threshold, velocity and structuring rules over client funding and trading activity."
        contentClassName="pt-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {COMPLIANCE_ALERTS.map((alert) => (
              <TableRow key={alert.id} className="align-top">
                <TableCell>
                  <Badge variant="outline">{alert.type}</Badge>
                </TableCell>
                <TableCell>
                  <SeverityBadge severity={alert.severity} />
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">
                  {alert.clientName}
                </TableCell>
                <TableCell className="max-w-md text-muted-foreground">
                  {alert.description}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatAmount(alert.amountNgwee)}
                </TableCell>
                <TableCell>
                  <AlertStatusBadge status={alert.status} />
                </TableCell>
                <TableCell className="text-right">
                  <ProposeActionButton
                    kind="FILE_STR"
                    summary={
                      alert.status === "ESCALATED"
                        ? `File STR for ${alert.clientName}: ${alert.type}`
                        : `Review ${alert.type} alert for ${alert.clientName}`
                    }
                    targetRef={alert.id}
                    label={alert.status === "ESCALATED" ? "File STR" : "Review"}
                    iconName={alert.status === "ESCALATED" ? "file" : "eye"}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="pt-3 text-xs text-muted-foreground">
          Actions route to approvals. A checker confirms before any case state changes.
        </p>
      </SectionCard>

      <SurveillancePanel />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Sanctions and PEP hit queue"
          icon={Radar}
          description="Matches against the OFAC, UN, EU and UK consolidated lists and the PEP register."
        >
          <div className="space-y-3">
            {screeningHits.map((hit) => (
              <div key={hit.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{hit.type}</Badge>
                    <span className="font-medium">{hit.clientName}</span>
                  </div>
                  <SeverityBadge severity={hit.severity} />
                </div>
                <p className="pt-2 text-sm text-muted-foreground">{hit.description}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    Raised {formatDateZM(hit.raisedAt)}
                  </span>
                  <AlertStatusBadge status={hit.status} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="STR and SAR cases"
          icon={FileText}
          description="Suspicious transaction reports drafted and filed with the FIC."
        >
          <div className="space-y-3">
            {strCases.map((strCase) => (
              <div key={strCase.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{strCase.clientName}</span>
                  <Badge
                    variant="outline"
                    className={
                      strCase.status === "FILED" || strCase.status === "ACKNOWLEDGED"
                        ? "border-transparent bg-emerald-100 text-emerald-800"
                        : "border-transparent bg-amber-100 text-amber-800"
                    }
                  >
                    {strCase.status}
                  </Badge>
                </div>
                <p className="pt-2 text-sm text-muted-foreground">{strCase.narrative}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    Built from {strCase.alertIds.length} alert
                    {strCase.alertIds.length === 1 ? "" : "s"}
                  </span>
                  {strCase.status === "DRAFT" ? (
                    <ProposeActionButton
                      kind="FILE_STR"
                      summary={`File the STR on ${strCase.clientName} with the FIC`}
                      targetRef={strCase.id}
                      label="File with FIC"
                      iconName="file"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Filed {strCase.filedAt ? formatDateZM(strCase.filedAt) : "-"}
                    </span>
                  )}
                </div>
                {strCase.status === "DRAFT" ? (
                  <div className="pt-3">
                    <AskAiButton
                      task="str-narrative"
                      proposalKind="FILE_STR"
                      targetRef={strCase.id}
                      label="Draft with AI"
                      fallbackSummary={`File the suspicious transaction report on ${strCase.clientName} with the FIC.`}
                      context={{
                        subsystem: "Compliance",
                        businessDate: formatDateZM(DEMO_TODAY),
                        facts: { case: strCase },
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Filing an STR routes to approvals for a compliance checker.
            </p>
          </div>
        </SectionCard>
      </div>
    </OpsPage>
  );
}
