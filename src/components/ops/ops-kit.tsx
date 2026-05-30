import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Shared presentational building blocks for the ops subsystem boards. */

type Tone = "positive" | "warning" | "danger" | "neutral" | "info" | "brand";

const TONE_CLASSES: Record<Tone, string> = {
  positive:
    "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-transparent",
  warning:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-transparent",
  danger:
    "bg-destructive/10 text-destructive border-transparent",
  neutral: "bg-secondary text-secondary-foreground border-transparent",
  info: "border-border text-foreground",
  brand: "bg-brand-green text-brand-cream border-transparent",
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
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
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
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}) {
  const accent: Record<Tone, string> = {
    positive: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-destructive",
    neutral: "text-foreground",
    info: "text-foreground",
    brand: "text-brand-green",
  };
  return (
    <Card size="sm">
      <CardContent className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={cn("font-display text-xl font-semibold tabular-nums", accent[tone])}>
          {value}
        </p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {children}
    </div>
  );
}
