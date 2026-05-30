import { Badge } from "@/components/ui/badge";
import type {
  AlertSeverity,
  AlertStatus,
  KycStatus,
  KycTier,
  ReportStatus,
} from "@/lib/ops/types";
import type { KillSwitchMode } from "@/lib/ops/risk";

/**
 * Read-only status and severity badges shared across the compliance, KYC, risk
 * and reporting screens. Colours are Tailwind utility classes layered over the
 * outline badge variant so they stay consistent with the ops design tokens.
 */

const TONE = {
  red: "border-transparent bg-red-100 text-red-800",
  amber: "border-transparent bg-amber-100 text-amber-800",
  emerald: "border-transparent bg-emerald-100 text-emerald-800",
  sky: "border-transparent bg-sky-100 text-sky-800",
  slate: "border-transparent bg-slate-100 text-slate-700",
} as const;

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const tone: Record<AlertSeverity, string> = {
    LOW: TONE.slate,
    MEDIUM: TONE.amber,
    HIGH: TONE.red,
    CRITICAL: TONE.red,
  };
  return (
    <Badge variant="outline" className={tone[severity]}>
      {severity}
    </Badge>
  );
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  const tone: Record<AlertStatus, string> = {
    OPEN: TONE.sky,
    REVIEWING: TONE.amber,
    CLEARED: TONE.emerald,
    ESCALATED: TONE.red,
  };
  return (
    <Badge variant="outline" className={tone[status]}>
      {status}
    </Badge>
  );
}

export function KycStatusBadge({ status }: { status: KycStatus }) {
  const tone: Record<KycStatus, string> = {
    PENDING: TONE.sky,
    IN_REVIEW: TONE.amber,
    APPROVED: TONE.emerald,
    REJECTED: TONE.red,
    REFRESH_DUE: TONE.amber,
  };
  const label = status.replace("_", " ");
  return (
    <Badge variant="outline" className={tone[status]}>
      {label}
    </Badge>
  );
}

export function TierBadge({ tier }: { tier: KycTier }) {
  return (
    <Badge variant="outline" className={TONE.slate}>
      {tier.replace("_", " ")}
    </Badge>
  );
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const tone: Record<ReportStatus, string> = {
    DRAFT: TONE.slate,
    DUE: TONE.amber,
    SUBMITTED: TONE.sky,
    ACCEPTED: TONE.emerald,
    OVERDUE: TONE.red,
  };
  return (
    <Badge variant="outline" className={tone[status]}>
      {status}
    </Badge>
  );
}

export function BreachBadge({ breached }: { breached: boolean }) {
  return breached ? (
    <Badge variant="outline" className={TONE.red}>
      Breached
    </Badge>
  ) : (
    <Badge variant="outline" className={TONE.emerald}>
      Within limit
    </Badge>
  );
}

export function KillSwitchBadge({ mode }: { mode: KillSwitchMode }) {
  return mode === "LIVE" ? (
    <Badge variant="outline" className={TONE.emerald}>
      Live
    </Badge>
  ) : (
    <Badge variant="outline" className={TONE.red}>
      Halted
    </Badge>
  );
}
