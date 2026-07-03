"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BookOpen,
  Scale,
  Landmark,
  CalendarClock,
  Receipt,
  ShieldCheck,
  UserCheck,
  Gauge,
  FileText,
  ClipboardCheck,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useOpsNavCounts,
  type OpsNavCounts,
} from "@/lib/hooks/use-ops-nav-counts";
import { OpsCountBadge } from "@/components/ops/ops-kit";

type CountKey = keyof Pick<
  OpsNavCounts,
  | "orders"
  | "settlementFails"
  | "reconBreaks"
  | "pendingApprovals"
  | "openAlerts"
  | "kycInReview"
  | "overdueReports"
>;

type OpsLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  countKey?: CountKey;
};

type OpsNavGroup = {
  label: string;
  links: readonly OpsLink[];
};

const OPS_NAV_GROUPS: readonly OpsNavGroup[] = [
  {
    label: "Overview",
    links: [
      { href: "/ops", label: "Control Tower", icon: LayoutDashboard },
      {
        href: "/ops/orders",
        label: "Operator Queue",
        icon: ListChecks,
        countKey: "orders",
      },
    ],
  },
  {
    label: "Post-trade",
    links: [
      {
        href: "/ops/settlement",
        label: "Settlement",
        icon: ArrowLeftRight,
        countKey: "settlementFails",
      },
      { href: "/ops/ledger", label: "Ledger", icon: BookOpen },
      {
        href: "/ops/reconciliation",
        label: "Reconciliation",
        icon: Scale,
        countKey: "reconBreaks",
      },
      { href: "/ops/treasury", label: "Treasury", icon: Landmark },
    ],
  },
  {
    label: "Governance",
    links: [
      {
        href: "/ops/corporate-actions",
        label: "Corporate Actions",
        icon: CalendarClock,
      },
      { href: "/ops/fees", label: "Fees and Tax", icon: Receipt },
      {
        href: "/ops/approvals",
        label: "Approvals",
        icon: ClipboardCheck,
        countKey: "pendingApprovals",
      },
    ],
  },
  {
    label: "Risk and compliance",
    links: [
      {
        href: "/ops/compliance",
        label: "Compliance",
        icon: ShieldCheck,
        countKey: "openAlerts",
      },
      {
        href: "/ops/kyc",
        label: "KYC Ops",
        icon: UserCheck,
        countKey: "kycInReview",
      },
      { href: "/ops/risk", label: "Risk", icon: Gauge },
      {
        href: "/ops/reporting",
        label: "Reporting",
        icon: FileText,
        countKey: "overdueReports",
      },
    ],
  },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/ops") return pathname === "/ops";
  return pathname.startsWith(href);
}

export function OpsNav({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const counts = useOpsNavCounts();

  return (
    <nav className={cn("flex flex-col gap-4 p-3", className)}>
      {OPS_NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.links.map(({ href, label, icon: Icon, countKey }) => {
              const active = isActive(pathname, href);
              const badgeCount = countKey ? counts[countKey] : 0;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-brand-green text-brand-cream shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon size={17} strokeWidth={active ? 2.4 : 2} />
                  <span className="truncate">{label}</span>
                  <OpsCountBadge
                    count={badgeCount}
                    onActiveSurface={active}
                    className="ml-auto"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
