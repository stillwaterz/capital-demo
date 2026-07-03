"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  ClipboardList,
  ShieldAlert,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { useOpsGovernanceStore } from "@/lib/store/ops-governance";
import {
  approverRoles,
  canApprove,
  kindLabel,
  listApproved,
  listPending,
  listRejected,
  PROPOSAL_KIND_LABELS,
  PROPOSAL_KIND_PERMISSIONS,
  ROLE_LABELS,
  ROLE_SUBSYSTEMS,
  roleLabel,
  STAFF_ROLES,
} from "@/lib/ops/governance";
import type { Proposal, ProposalKind, StaffRole } from "@/lib/ops/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  EmptyState,
  OpsCountBadge,
  OpsPage,
  PageHeading,
  SectionCard,
  StatCard,
  StatGrid,
  ToneBadge,
} from "@/components/ops/ops-kit";

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}, ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function actorFor(role: StaffRole): string {
  return `${roleLabel(role)} checker`;
}

function ProposalCard({
  proposal,
  role,
}: {
  proposal: Proposal;
  role: StaffRole;
}) {
  const approve = useOpsGovernanceStore((s) => s.approve);
  const reject = useOpsGovernanceStore((s) => s.reject);

  const roleAllowed = canApprove(role, proposal.kind);
  const blockedByGuardrail = !proposal.guardrailPassed;
  const canApproveNow =
    proposal.status === "PENDING" && roleAllowed && !blockedByGuardrail;

  return (
    <Card>
      <CardHeader className="border-b bg-muted/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ToneBadge tone="brand">{kindLabel(proposal.kind)}</ToneBadge>
            <span className="text-xs text-muted-foreground">{proposal.id}</span>
          </div>
          <ToneBadge tone={proposal.guardrailPassed ? "positive" : "danger"}>
            {proposal.guardrailPassed ? (
              <span className="flex items-center gap-1">
                <ShieldCheck size={12} /> Guardrail passed
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ShieldAlert size={12} /> Guardrail blocked
              </span>
            )}
          </ToneBadge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            AI proposal
          </p>
          <p className="text-sm leading-relaxed">{proposal.summary}</p>
          <p className="text-xs text-muted-foreground">
            Proposed by {proposal.proposedBy} on{" "}
            {formatTimestamp(proposal.proposedAt)}
          </p>
        </div>

        <div
          className={`rounded-lg border p-3 text-sm ${
            proposal.guardrailPassed
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-destructive/30 bg-destructive/5"
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Rules engine check
          </p>
          <p className="pt-1 text-foreground">{proposal.guardrailNote}</p>
        </div>

        <p className="text-xs text-muted-foreground">
          Approvers for this action: {approverRoles(proposal.kind).map(roleLabel).join(", ")}.
        </p>

        {proposal.status === "PENDING" ? (
          <>
            <Separator />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="bg-brand-green text-brand-cream hover:bg-brand-green-light"
                disabled={!canApproveNow}
                onClick={() =>
                  approve(proposal.id, { name: actorFor(role), role })
                }
              >
                <Check />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  reject(proposal.id, { name: actorFor(role), role })
                }
              >
                <X />
                Reject
              </Button>
              {blockedByGuardrail ? (
                <span className="text-xs text-destructive">
                  Cannot approve while the guardrail is blocked.
                </span>
              ) : !roleAllowed ? (
                <span className="text-xs text-amber-600">
                  {roleLabel(role)} is not authorised for this action.
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <Separator />
            <p className="text-xs text-muted-foreground">
              {proposal.status === "APPROVED" ? "Approved" : "Rejected"} by{" "}
              {proposal.decidedBy} on{" "}
              {proposal.decidedAt ? formatTimestamp(proposal.decidedAt) : "-"}.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ApprovalsConsole() {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<StaffRole>("OPS");
  const proposals = useOpsGovernanceStore((s) => s.proposals);
  const audit = useOpsGovernanceStore((s) => s.audit);
  const reset = useOpsGovernanceStore((s) => s.reset);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <OpsPage>
        <PageHeading
          title="Approvals"
          description="Maker-checker queue for AI proposals, with the deterministic guardrail check and an append-only audit log."
        />
        <p className="text-sm text-muted-foreground">Loading the queue...</p>
      </OpsPage>
    );
  }

  const pending = listPending(proposals);
  const approved = listApproved(proposals);
  const rejected = listRejected(proposals);
  const blocked = pending.filter((p) => !p.guardrailPassed).length;

  return (
    <OpsPage>
      <PageHeading
        title="Approvals"
        description="AI proposes, the rules engine disposes. Every proposed action runs a deterministic guardrail, then waits here for a human checker to approve or reject. Nothing changes until then."
        action={
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset queue
          </Button>
        }
      />

      <StatGrid>
        <StatCard
          label="Pending"
          value={String(pending.length)}
          tone={pending.length > 0 ? "warning" : "neutral"}
          icon={ClipboardList}
        />
        <StatCard
          label="Guardrail blocked"
          value={String(blocked)}
          tone={blocked > 0 ? "danger" : "positive"}
          hint="Cannot be approved"
          icon={ShieldAlert}
        />
        <StatCard
          label="Approved"
          value={String(approved.length)}
          tone="positive"
          icon={CheckCircle2}
        />
        <StatCard
          label="Rejected"
          value={String(rejected.length)}
          icon={XCircle}
        />
      </StatGrid>

      <Card size="sm">
        <CardContent className="flex flex-wrap items-center gap-2 py-4">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Acting as
          </span>
          {STAFF_ROLES.map((staffRole) => (
            <Button
              key={staffRole}
              size="xs"
              variant={role === staffRole ? "default" : "outline"}
              onClick={() => setRole(staffRole)}
            >
              {roleLabel(staffRole)}
            </Button>
          ))}
          <span className="text-xs text-muted-foreground">
            Switch role to see RBAC gate an action.
          </span>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            <OpsCountBadge count={pending.length} className="ml-1.5" />
          </TabsTrigger>
          <TabsTrigger value="decided">Decided</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 pt-4">
          {pending.length === 0 ? (
            <SectionCard title="Pending proposals" icon={ClipboardList}>
              <EmptyState
                icon={CheckCircle2}
                title="Queue clear"
                description="No proposals waiting for a checker decision."
              />
            </SectionCard>
          ) : (
            pending.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} role={role} />
            ))
          )}
        </TabsContent>

        <TabsContent value="decided" className="space-y-4 pt-4">
          {approved.length + rejected.length === 0 ? (
            <SectionCard title="Decided proposals" icon={ClipboardList}>
              <EmptyState
                icon={ClipboardList}
                title="No decisions yet"
                description="Approved and rejected proposals will appear here."
              />
            </SectionCard>
          ) : (
            [...approved, ...rejected].map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} role={role} />
            ))
          )}
        </TabsContent>

        <TabsContent value="audit" className="pt-4">
          <SectionCard
            title="Append-only audit log"
            icon={ShieldCheck}
            description="Immutable record of every approval, rejection and queue change."
            contentClassName="pt-0"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audit.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatTimestamp(event.at)}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {event.action}
                    </TableCell>
                    <TableCell>{event.actor}</TableCell>
                    <TableCell>
                      <ToneBadge tone="info">{roleLabel(event.actorRole)}</ToneBadge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.targetRef ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>

        <TabsContent value="roles" className="pt-4">
          <SectionCard
            title="Role-based access"
            icon={ShieldCheck}
            description="Which staff roles may approve each proposal kind."
            contentClassName="pt-0"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>May approve</TableHead>
                  <TableHead>Subsystems</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STAFF_ROLES.map((staffRole) => {
                  const kinds = (
                    Object.keys(PROPOSAL_KIND_LABELS) as ProposalKind[]
                  ).filter((kind) =>
                    PROPOSAL_KIND_PERMISSIONS[kind].includes(staffRole)
                  );
                  return (
                    <TableRow key={staffRole}>
                      <TableCell className="font-medium">
                        {ROLE_LABELS[staffRole]}
                      </TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        {staffRole === "ADMIN"
                          ? "All actions"
                          : kinds.map((kind) => kindLabel(kind)).join(", ")}
                      </TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        {ROLE_SUBSYSTEMS[staffRole].join(", ")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </OpsPage>
  );
}
