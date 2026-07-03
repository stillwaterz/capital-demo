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

type OpsLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const OPS_LINKS: readonly OpsLink[] = [
  { href: "/ops", label: "Control Tower", icon: LayoutDashboard },
  { href: "/ops/orders", label: "Operator Queue", icon: ListChecks },
  { href: "/ops/settlement", label: "Settlement", icon: ArrowLeftRight },
  { href: "/ops/ledger", label: "Ledger", icon: BookOpen },
  { href: "/ops/reconciliation", label: "Reconciliation", icon: Scale },
  { href: "/ops/treasury", label: "Treasury", icon: Landmark },
  { href: "/ops/corporate-actions", label: "Corporate Actions", icon: CalendarClock },
  { href: "/ops/fees", label: "Fees and Tax", icon: Receipt },
  { href: "/ops/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/ops/kyc", label: "KYC Ops", icon: UserCheck },
  { href: "/ops/risk", label: "Risk", icon: Gauge },
  { href: "/ops/reporting", label: "Reporting", icon: FileText },
  { href: "/ops/approvals", label: "Approvals", icon: ClipboardCheck },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/ops") return pathname === "/ops";
  return pathname.startsWith(href);
}

export function OpsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Operations
      </p>
      {OPS_LINKS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-brand-green text-brand-cream"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon size={18} strokeWidth={active ? 2.4 : 2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
