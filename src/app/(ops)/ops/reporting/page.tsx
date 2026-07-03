import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Send,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ActionLink,
  AlertBanner,
  OpsPage,
  PageHeading,
  PriorityItem,
  SectionCard,
  StatCard,
  StatGrid,
} from "@/components/ops/ops-kit";
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
    <OpsPage>
      <PageHeading
        title="Regulatory Reporting"
        description="Returns owed to the SEC, Bank of Zambia, Financial Intelligence Centre and Lusaka Securities Exchange, with due dates and status."
      />

      <StatGrid>
        <StatCard
          label="Outstanding"
          value={String(summary.outstanding)}
          hint={`${summary.total} tracked`}
          icon={FileText}
        />
        <StatCard
          label="Overdue"
          value={String(summary.overdue)}
          tone={summary.overdue > 0 ? "danger" : "positive"}
          icon={AlertTriangle}
        />
        <StatCard
          label="Submitted"
          value={String(summary.submitted)}
          icon={Send}
        />
        <StatCard
          label="Accepted"
          value={String(summary.accepted)}
          tone="positive"
          icon={CheckCircle2}
        />
      </StatGrid>

      {overdue.length > 0 ? (
        <div id="overdue-returns" className="scroll-mt-24">
        <SectionCard
          title="Overdue and due now"
          icon={AlertTriangle}
          iconClassName="text-destructive"
          description={`Returns past or at their deadline as at ${formatDateZM(DEMO_TODAY)}.`}
        >
          <div className="space-y-2">
            {[...overdue, ...upcoming].map((report) => (
              <PriorityItem
                key={report.id}
                tone={report.status === "OVERDUE" ? "danger" : "warning"}
                title={`${report.body}: ${report.name}`}
                detail={`Period ${report.period} - due ${formatDateZM(report.dueDate)}`}
              />
            ))}
          </div>
          <p className="pt-3 text-xs text-muted-foreground">
            Submitting a return routes to approvals for a checker before it is marked filed.
          </p>
        </SectionCard>
        </div>
      ) : null}

      {summary.overdue > 0 ? (
        <AlertBanner
          tone="danger"
          icon={AlertTriangle}
          title={`${summary.overdue} overdue return${summary.overdue === 1 ? "" : "s"}`}
          description="File or extend before the regulator deadline to stay compliant."
          action={<ActionLink href="#overdue-returns">Review overdue</ActionLink>}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {BODIES.map((body) => {
          const reports = REG_REPORTS.filter((r) => r.body === body);
          return (
            <SectionCard
              key={body}
              title={body}
              icon={FileText}
              description={REG_BODY_NAMES[body]}
              contentClassName="pt-0"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="align-top">
                      <TableCell className="font-medium">
                        {report.name}
                        {isOutstanding(report) ? null : (
                          <span className="block text-xs font-normal text-muted-foreground">
                            {report.submittedAt
                              ? `Filed ${formatDateZM(report.submittedAt)}`
                              : ""}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {report.period}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateZM(report.dueDate)}
                      </TableCell>
                      <TableCell>
                        <ReportStatusBadge status={report.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          );
        })}
      </div>
    </OpsPage>
  );
}
