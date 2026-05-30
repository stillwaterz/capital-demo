import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OpsPlaceholderProps = {
  title: string;
  description: string;
};

/**
 * Standard page scaffold for ops routes. Downstream workers replace the page
 * body with their own subsystem UI but reuse this title block if useful.
 */
export function OpsPlaceholder({ title, description }: OpsPlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming in this build</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This subsystem is being wired up. The engine and screen land in a
            later phase of the operations console build.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
