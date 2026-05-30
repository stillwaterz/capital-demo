import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeading, StatCard } from "@/components/ops/ops-stat";
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

function formatAmount(amountNgwee: number | null): string {
  return amountNgwee === null ? "-" : formatZMW(amountNgwee);
}

export default function CompliancePage() {
  const summary = complianceSummary();
  const screeningHits = getScreeningHits();
  const strCases = getStrCases();

  return (
    <div className="space-y-6">
      <PageHeading
        title="Compliance"
        description="AML transaction monitoring, sanctions and PEP screening, and STR cases routed to the Financial Intelligence Centre."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Open alerts" value={summary.openAlerts} hint={`${summary.totalAlerts} total`} />
        <StatCard label="Escalated" value={summary.escalatedAlerts} emphasis="warn" />
        <StatCard label="Critical" value={summary.criticalAlerts} emphasis="warn" />
        <StatCard label="Screening hits" value={summary.screeningHits} hint="Sanctions and PEP" />
        <StatCard label="STR cases" value={strCases.length} hint={`${summary.strFiled} filed, ${summary.strDraft} draft`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction monitoring alerts</CardTitle>
          <CardDescription>
            Threshold, velocity and structuring rules over client funding and trading activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Severity</th>
                <th className="py-2 pr-3 font-medium">Client</th>
                <th className="py-2 pr-3 font-medium">Detail</th>
                <th className="py-2 pr-3 text-right font-medium">Amount</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pl-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {COMPLIANCE_ALERTS.map((alert) => (
                <tr key={alert.id} className="border-b align-top last:border-0">
                  <td className="py-3 pr-3">
                    <Badge variant="outline">{alert.type}</Badge>
                  </td>
                  <td className="py-3 pr-3">
                    <SeverityBadge severity={alert.severity} />
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap font-medium">{alert.clientName}</td>
                  <td className="max-w-md py-3 pr-3 text-muted-foreground">{alert.description}</td>
                  <td className="py-3 pr-3 text-right whitespace-nowrap tabular-nums">
                    {formatAmount(alert.amountNgwee)}
                  </td>
                  <td className="py-3 pr-3">
                    <AlertStatusBadge status={alert.status} />
                  </td>
                  <td className="py-3 pl-3 text-right">
                    <Button variant="outline" size="xs">
                      {alert.status === "ESCALATED" ? "File STR" : "Review"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pt-3 text-xs text-muted-foreground">
            Actions route to approvals. A checker confirms before any case state changes.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sanctions and PEP hit queue</CardTitle>
            <CardDescription>
              Matches against the OFAC, UN, EU and UK consolidated lists and the PEP register.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>STR and SAR cases</CardTitle>
            <CardDescription>
              Suspicious transaction reports drafted and filed with the FIC.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
                    Built from {strCase.alertIds.length} alert{strCase.alertIds.length === 1 ? "" : "s"}
                  </span>
                  {strCase.status === "DRAFT" ? (
                    <Button variant="outline" size="xs">
                      File with FIC
                    </Button>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
