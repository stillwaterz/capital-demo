import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading, StatCard } from "@/components/ops/ops-stat";
import { KycStatusBadge, TierBadge } from "@/components/ops/ops-badges";
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
    <div className="space-y-6">
      <PageHeading
        title="KYC Operations"
        description="Tiered onboarding review under the FIC and DPA Zambia 2021 framework, tier-upgrade requests and periodic refresh reviews."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="In queue" value={onboarding.length} hint={`${summary.total} tracked`} />
        <StatCard label="Pending" value={summary.pending} />
        <StatCard label="In review" value={summary.inReview} emphasis="warn" />
        <StatCard label="Upgrade requests" value={summary.upgradeRequests} />
        <StatCard label="Refresh due" value={summary.refreshDue} emphasis="warn" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tier model</CardTitle>
          <CardDescription>
            Verification requirements and monthly transaction ceilings per tier.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding review queue</CardTitle>
          <CardDescription>
            New submissions awaiting a decision across Tier 0 to Tier 2.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Client</th>
                <th className="py-2 pr-3 font-medium">Tier</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Note</th>
                <th className="py-2 pr-3 font-medium">Submitted</th>
                <th className="py-2 pl-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {onboarding.map((item) => (
                <tr key={item.id} className="border-b align-top last:border-0">
                  <td className="py-3 pr-3 whitespace-nowrap font-medium">{item.clientName}</td>
                  <td className="py-3 pr-3">
                    <TierFlow item={item} />
                  </td>
                  <td className="py-3 pr-3">
                    <KycStatusBadge status={item.status} />
                  </td>
                  <td className="max-w-md py-3 pr-3 text-muted-foreground">{item.note}</td>
                  <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">
                    {formatDateZM(item.submittedAt)}
                  </td>
                  <td className="py-3 pl-3 text-right">
                    <Button variant="outline" size="xs">
                      Approve
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pt-3 text-xs text-muted-foreground">
            Approving a tier upgrade routes to approvals for a maker-checker decision.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tier upgrade requests</CardTitle>
            <CardDescription>Clients asking to move up a tier.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Periodic refresh due</CardTitle>
            <CardDescription>
              Existing clients whose documents or risk profile need a refresh.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
