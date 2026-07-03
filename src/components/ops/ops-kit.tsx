import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Shared presentational building blocks for the ops subsystem boards. */

type Tone = "positive" | "warning" | "danger" | "neutral" | "info" | "brand";

const TONE_CLASSES: Record<Tone, string> = {
  positive:
    "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-transparent",
  warning:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-transparent",
  danger: "bg-destructive/10 text-destructive border-transparent",
  neutral: "bg-secondary text-secondary-foreground border-transparent",
  info: "border-border text-foreground",
  brand: "bg-brand-green text-brand-cream border-transparent",
};

const STAT_ACCENT: Record<Tone, string> = {
  positive: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-destructive",
  neutral: "text-foreground",
  info: "text-foreground",
  brand: "text-brand-green",
};

const STAT_ICON_BG: Record<Tone, string> = {
  positive: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
  info: "bg-muted text-muted-foreground",
  brand: "bg-brand-green/10 text-brand-green",
};

export function ToneBadge({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge className={cn(TONE_CLASSES[tone], className)}>{children}</Badge>
  );
}

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
  icon?: LucideIcon;
}) {
  return (
    <Card size="sm" className="overflow-hidden">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {Icon ? (
            <span
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                STAT_ICON_BG[tone]
              )}
            >
              <Icon size={16} strokeWidth={2.2} />
            </span>
          ) : null}
        </div>
        <p
          className={cn(
            "font-display text-2xl font-semibold tabular-nums tracking-tight",
            STAT_ACCENT[tone]
          )}
        >
          {value}
        </p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function StatGrid({
  children,
  columns = 4,
}: {
  children: React.ReactNode;
  columns?: 4 | 5;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-2",
        columns === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"
      )}
    >
      {children}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  iconClassName,
  children,
  action,
  contentClassName,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b bg-muted/20 py-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            {Icon ? (
              <Icon size={16} className={cn("text-brand-green", iconClassName)} />
            ) : null}
            {title}
          </CardTitle>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className={cn("pt-4", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

export function AlertBanner({
  tone = "warning",
  icon: Icon,
  title,
  description,
  action,
}: {
  tone?: "warning" | "danger" | "info";
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const styles = {
    warning: "border-amber-500/30 bg-amber-500/5",
    danger: "border-destructive/30 bg-destructive/5",
    info: "border-border bg-muted/30",
  };
  const iconStyles = {
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-destructive",
    info: "text-brand-green",
  };
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3",
        styles[tone]
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 shrink-0", iconStyles[tone])} size={20} />
        <div className="space-y-0.5">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

/** Standard vertical rhythm for ops pages. */
export function OpsPage({ children }: { children: React.ReactNode }) {
  return <div className="space-y-8">{children}</div>;
}

export function ActionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      nativeButton={false}
      render={<Link href={href} />}
      className="mt-1 gap-1"
    >
      {children}
      <ArrowRight size={14} />
    </Button>
  );
}

export function PriorityItem({
  title,
  detail,
  tone = "warning",
  href,
}: {
  title: string;
  detail: string;
  tone?: "danger" | "warning";
  href?: string;
}) {
  const content = (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 text-sm transition-colors",
        tone === "danger"
          ? "border-destructive/20 bg-destructive/5"
          : "border-amber-500/20 bg-amber-500/5",
        href && "hover:bg-muted/40"
      )}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <Icon size={18} />
      </span>
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
