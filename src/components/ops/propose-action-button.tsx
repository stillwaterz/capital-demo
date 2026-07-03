"use client";

import { useState } from "react";
import {
  Check,
  Eye,
  FileText,
  Power,
  RefreshCw,
  Send,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOpsGovernanceStore } from "@/lib/store/ops-governance";
import type { ProposalKind } from "@/lib/ops/types";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive";
type ButtonSize = "xs" | "sm" | "default" | "lg";

/**
 * Named icons for callers that live in a Server Component. A function component
 * cannot cross the server to client boundary as a prop, so server pages pass an
 * `iconName` string and the icon is resolved here on the client.
 */
const ICONS = {
  send: Send,
  check: Check,
  file: FileText,
  eye: Eye,
  power: Power,
  wallet: Wallet,
  refresh: RefreshCw,
} satisfies Record<string, LucideIcon>;

type IconName = keyof typeof ICONS;

type ConfirmConfig = {
  title: string;
  body: string;
  confirmLabel: string;
};

type Props = {
  /** Governance proposal kind this control raises. */
  kind: ProposalKind;
  /** Plain English summary written into the approvals queue. */
  summary: string;
  /** The subsystem entity the proposal acts on, for example a case or trade id. */
  targetRef: string;
  label: string;
  /** Icon component. Only pass this from a Client Component. */
  icon?: LucideIcon;
  /** Named icon for Server Component callers (a component cannot cross the boundary). */
  iconName?: IconName;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** When set, clicking opens a confirm dialog before the proposal is raised. */
  confirm?: ConfirmConfig;
  /** Confirmation text shown once the proposal is sent. */
  sentLabel?: string;
};

/**
 * Turns an ops action control into a maker action that routes to the approvals
 * queue. AI or staff propose, a human checker disposes. Deterministic code owns
 * the actual release, so this only ever raises a proposal, never executes.
 */
export function ProposeActionButton({
  kind,
  summary,
  targetRef,
  label,
  icon,
  iconName,
  variant = "outline",
  size = "xs",
  className,
  confirm,
  sentLabel = "Sent to approvals",
}: Props) {
  const Icon = icon ?? (iconName ? ICONS[iconName] : Send);
  const [sent, setSent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const addProposal = useOpsGovernanceStore((s) => s.addProposal);

  function raise() {
    addProposal({ kind, summary, targetRef, proposedBy: "Back office (maker)" });
    setSent(true);
    setConfirmOpen(false);
  }

  if (sent) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400",
          className
        )}
      >
        <Check size={14} />
        {sentLabel}
      </span>
    );
  }

  if (confirm) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => setConfirmOpen(true)}
        >
          <Icon />
          {label}
        </Button>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirm.title}</DialogTitle>
              <DialogDescription>{confirm.body}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose
                render={<Button variant="ghost" size="sm" />}
              >
                Cancel
              </DialogClose>
              <Button
                variant={variant === "destructive" ? "destructive" : "default"}
                size="sm"
                onClick={raise}
              >
                {confirm.confirmLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={raise}
    >
      <Icon />
      {label}
    </Button>
  );
}
