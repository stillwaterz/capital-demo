import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeading, StatCard } from "@/components/ops/ops-stat";
import { ReportStatusBadge } from "@/components/ops/ops-badges";
import {
  REG_BODY_NAMES,
  REG_REPORTS,
  getOverdueReports,
  getUpcomingReports,
  isOutstanding,
  regReportingSummary,
} from "@/lib/ops/reg-reporting";
import type { RegBody } from "@/lib/ops/types";
import { DEMO_TODAY } from "@/lib/ops/clock";
import { formatDateZM } from "@/lib/format";

const BODIES: readonly RegBody[] = ["SEC", "BOZ", "FIC", "LUSE"];

export default function ReportingPage() {
  const summary = regReportingSummary();
  const overdue = getOverdueReports();
  const upcoming = getUpcomingReports();

  return (
    <div className="space-y-6">
      <PageHeading
        title="Regulatory Reporting"
        description="Returns owed to the SEC, Bank of Zambia, Financial Intelligence Centre and Lusaka Securities Exchange, with due dates and status."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Outstanding" value={summary.outstanding} hint={`${summary.total} tracked`} />
        <StatCard
          label="Overdue"
          value={summary.overdue}
          emphasis={summary.overdue > 0 ? "warn" : "good"}
        />
        <StatCard label="Submitted" value={summary.submitted} />
        <StatCard label="Accepted" value={summary.accepted} emphasis="good" />
      </div>

      {overdue.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Overdue and due now</CardTitle>
            <CardDescription>
              Returns past or at their deadline as at {formatDateZM(DEMO_TODAY)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...overdue, ...upcoming].map((report) => (
              <div
                key={report.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{report.body}</Badge>
                    <span className="font-medium">{report.name}</span>
                  </div>
                  <p className="pt-1 text-xs text-muted-foreground">
                    Period {report.period} - due {formatDateZM(report.dueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ReportStatusBadge status={report.status} />
                  <Button variant="outline" size="xs">
                    Submit
                  </Button>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Submitting a return routes to approvals for a checker before it is marked filed.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {BODIES.map((body) => {
          const reports = REG_REPORTS.filter((r) => r.body === body);
          return (
            <Card key={body}>
              <CardHeader>
                <CardTitle>{body}</CardTitle>
                <CardDescription>{REG_BODY_NAMES[body]}</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Return</th>
                      <th className="py-2 pr-3 font-medium">Period</th>
                      <th className="py-2 pr-3 font-medium">Due</th>
                      <th className="py-2 pl-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="border-b align-top last:border-0">
                        <td className="py-3 pr-3 font-medium">
                          {report.name}
                          {isOutstanding(report) ? null : (
                            <span className="block text-xs font-normal text-muted-foreground">
                              {report.submittedAt
                                ? `Filed ${formatDateZM(report.submittedAt)}`
                                : ""}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">
                          {report.period}
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">
                          {formatDateZM(report.dueDate)}
                        </td>
                        <td className="py-3 pl-3">
                          <ReportStatusBadge status={report.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
