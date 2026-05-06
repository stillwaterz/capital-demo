import { EquitiesClient } from "@/components/equities-client";
import { INSTRUMENTS } from "@/lib/mock/instruments";

export default function EquitiesPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold tracking-tight font-display">LuSE Equities</h1>
        <p className="text-base text-muted-foreground mt-1">
          All counters listed on the Lusaka Securities Exchange. Prices are demo data.
        </p>
      </section>
      <EquitiesClient instruments={INSTRUMENTS} />
    </div>
  );
}
