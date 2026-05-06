import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const SOURCES = [
  {
    label: "USD/ZMW exchange rate",
    detail: "Frankfurter API (api.frankfurter.dev) - refreshed every 30 minutes.",
    live: true,
  },
  {
    label: "Copper price",
    detail: "Yahoo Finance (HG=F futures) - refreshed every 30 minutes.",
    live: true,
  },
  {
    label: "Zambian financial news",
    detail: "Lusaka Times RSS feed (lusakatimes.com) - filtered to financial topics, refreshed every 30 minutes.",
    live: true,
  },
  {
    label: "LuSE equity prices",
    detail: "Demo data. Live prices via Pangaea Securities feed on launch.",
    live: false,
  },
  {
    label: "T-bill yields and BoZ rate",
    detail: "Demo data based on recent BoZ auction results. Live via Pangaea on launch.",
    live: false,
  },
  {
    label: "LuSE All-Share Index",
    detail: "Demo data. Live via LuSE data feed on launch.",
    live: false,
  },
];

export default function DataSourcesPage() {
  return (
    <div className="space-y-6">
      <section>
        <Link href="/" className="text-sm text-brand-green hover:underline mb-4 inline-block">
          Back to home
        </Link>
        <h1 className="text-3xl font-bold font-display">Data sources</h1>
        <p className="text-base text-muted-foreground mt-1">
          Where the numbers in MarketLink come from.
        </p>
      </section>

      <div className="space-y-3">
        {SOURCES.map((s) => (
          <Card key={s.label} className="border border-brand-ink/10">
            <CardContent className="py-4 px-5">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                    s.live ? "bg-brand-green animate-pulse" : "bg-muted-foreground/30"
                  }`}
                />
                <div>
                  <p className="text-base font-semibold">{s.label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{s.detail}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Green dot = live data. Grey dot = demo data.
      </p>
    </div>
  );
}
