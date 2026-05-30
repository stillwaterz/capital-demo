import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  emphasis?: "default" | "warn" | "good";
};

/** Compact metric card used across the ops dashboards. */
export function StatCard({ label, value, hint, emphasis = "default" }: StatCardProps) {
  const valueTone =
    emphasis === "warn"
      ? "text-red-700"
      : emphasis === "good"
        ? "text-emerald-700"
        : "text-foreground";
  return (
    <Card size="sm">
      <CardContent className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={`font-display text-2xl font-bold tracking-tight ${valueTone}`}>
          {value}
        </p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

type PageHeadingProps = {
  title: string;
  description: string;
};

/** Standard ops page title block. */
export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <div className="space-y-1">
      <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
