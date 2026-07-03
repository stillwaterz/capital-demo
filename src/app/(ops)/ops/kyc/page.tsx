import {
  ArrowUp,
  Clock,
  Eye,
  RefreshCw,
  UserCheck,
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
  OpsPage,
  PageHeading,
  SectionCard,
  StatCard,
  StatGrid,
} from "@/components/ops/ops-kit";
import { KycStatusBadge, TierBadge } from "@/components/ops/ops-badges";
import { ProposeActionButton } from "@/components/ops/propose-action-button";
import {
  KYC_TIER_SPECS,
  getOnboardingQueue,
  getRefreshDue,
  getTierUpgradeRequests,
  kycSummary,
} from "@/lib/ops/kyc-queue";
import type { KycReviewItem } from "@/lib/ops/types";
import { formatZMW } from "@/lib/format";
import { formatDateZM } from "@/lib/format";

function TierFlow({ item }: { item: KycReviewItem }) {
  if (item.currentTier === item.requestedTier) {
    return <TierBadge tier={item.currentTier} />;
  }
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <TierBadge tier={item.currentTier} />
      <span className="text-muted-foreground">to</span>
      <TierBadge tier={item.requestedTier} />
    </span>
  );
}

export default function KycPage() {
  const summary = kycSummary();
  const onboarding = getOnboardingQueue();
  const upgrades = getTierUpgradeRequests();
  const refreshDue = getRefreshDue();

  return (
    <OpsPage>
      <PageHeading
        title="KYC Operations"
        description="Tiered onboarding review under the FIC and DPA Zambia 2021 framework, tier-upgrade requests and periodic refresh reviews."
      />

      <StatGrid columns={5}>
        <StatCard
          label="In queue"
          value={String(onboarding.length)}
          hint={`${summary.total} tracked`}
          icon={UserCheck}
        />
        <StatCard label="Pending" value={String(summary.pending)} icon={Clock} />
        <StatCard
          label="In review"
          value={String(summary.inReview)}
          tone={summary.inReview > 0 ? "warning" : "neutral"}
          icon={Eye}
        />
        <StatCard
          label="Upgrade requests"
          value={String(summary.upgradeRequests)}
          icon={ArrowUp}
        />
        <StatCard
          label="Refresh due"
          value={String(summary.refreshDue)}
          tone={summary.refreshDue > 0 ? "warning" : "neutral"}
          icon={RefreshCw}
        />
      </StatGrid>

      <SectionCard
        title="Tier model"
        icon={UserCheck}
        description="Verification requirements and monthly transaction ceilings per tier."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {KYC_TIER_SPECS.map((spec) => (
            <div key={spec.tier} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <TierBadge tier={spec.tier} />
                <span className="text-sm font-medium">{spec.name}</span>
              </div>
              <p className="pt-2 text-xs text-muted-foreground">{spec.capability}</p>
              <p className="pt-2 text-sm font-medium tabular-nums">
                {spec.monthlyLimitNgwee === 0
                  ? "No wallet"
                  : `${formatZMW(spec.monthlyLimitNgwee)} per month`}
              </p>
              <ul className="pt-2 text-xs text-muted-foreground">
                {spec.requirements.map((req) => (
                  <li key={req}>- {req}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Onboarding review queue"
        icon={Eye}
        description="New submissions awaiting a decision across Tier 0 to Tier 2."
        contentClassName="pt-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {onboarding.map((item) => (
              <TableRow key={item.id} className="align-top">
                <TableCell className="whitespace-nowrap font-medium">
                  {item.clientName}
                </TableCell>
                <TableCell>
                  <TierFlow item={item} />
                </TableCell>
                <TableCell>
                  <KycStatusBadge status={item.status} />
                </TableCell>
                <TableCell className="max-w-md text-muted-foreground">
                  {item.note}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateZM(item.submittedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <ProposeActionButton
                    kind="TIER_UPGRADE"
                    summary={`Approve KYC for ${item.clientName} (${item.currentTier} to ${item.requestedTier})`}
                    targetRef={item.id}
                    label="Approve"
                    iconName="check"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="pt-3 text-xs text-muted-foreground">
          Approving a tier upgrade routes to approvals for a maker-checker decision.
        </p>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Tier upgrade requests"
          icon={ArrowUp}
          description="Clients asking to move up a tier."
        >
          <div className="space-y-3">
            {upgrades.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{item.clientName}</span>
                  <KycStatusBadge status={item.status} />
                </div>
                <div className="pt-2">
                  <TierFlow item={item} />
                </div>
                <p className="pt-2 text-sm text-muted-foreground">{item.note}</p>
                <div className="pt-3">
                  <ProposeActionButton
                    kind="TIER_UPGRADE"
                    summary={`Approve tier upgrade for ${item.clientName} (${item.currentTier} to ${item.requestedTier})`}
                    targetRef={item.id}
                    label="Approve upgrade"
                    iconName="check"
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Periodic refresh due"
          icon={RefreshCw}
          description="Existing clients whose documents or risk profile need a refresh."
        >
          <div className="space-y-3">
            {refreshDue.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TierBadge tier={item.currentTier} />
                    <span className="font-medium">{item.clientName}</span>
                  </div>
                  <KycStatusBadge status={item.status} />
                </div>
                <p className="pt-2 text-sm text-muted-foreground">{item.note}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </OpsPage>
  );
}
