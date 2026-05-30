"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";

const CUSTOMER_HREF = "/home";
const OPS_HREF = "/ops";

/**
 * Flips the demo between the customer app and the operations console.
 * Shows where you are now and links to the other surface.
 */
export function ModeSwitcher() {
  const pathname = usePathname();
  const inOps = pathname.startsWith("/ops");
  const targetHref = inOps ? CUSTOMER_HREF : OPS_HREF;
  const targetLabel = inOps ? "Customer app" : "Operations";

  return (
    <Link
      href={targetHref}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      title={`Switch to ${targetLabel}`}
    >
      <ArrowLeftRight size={15} className="text-brand-green" />
      <span className="hidden sm:inline">{targetLabel}</span>
    </Link>
  );
}
