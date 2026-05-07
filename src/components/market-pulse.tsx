import { INSTRUMENTS } from "@/lib/mock/instruments";
import { formatPercent } from "@/lib/format";
import { fetchUsdZmw } from "@/lib/data/fx";
import { fetchCopperPrice } from "@/lib/data/copper";

type Tile = {
  label: string;
  value: string;
  change: number;
  unit: string;
  live: boolean;
};

function topMover(direction: "up" | "down") {
  const sorted = [...INSTRUMENTS].sort((a, b) =>
    direction === "up"
      ? b.changePercent - a.changePercent
      : a.changePercent - b.changePercent
  );
  return sorted[0];
}

export async function MarketPulse() {
  const [fx, copper] = await Promise.all([fetchUsdZmw(), fetchCopperPrice()]);

  const topGainer = topMover("up");
  const topLoser = topMover("down");

  const tiles: Tile[] = [
    { label: "LuSE ALSI", value: "26,680.94", change: -0.15, unit: "", live: false },
    {
      label: "USD/ZMW",
      value: fx ? fx.rate.toFixed(2) : "27.14",
      change: 0,
      unit: "",
      live: !!fx,
    },
    {
      label: "Copper",
      value: copper ? copper.priceUsd.toFixed(2) : "4.61",
      change: copper ? copper.changePercent : -0.92,
      unit: "USD/lb",
      live: !!copper,
    },
    { label: "BoZ Rate", value: "13.5%", change: 0, unit: "", live: false },
    {
      label: "Top gainer",
      value: topGainer.symbol,
      change: topGainer.changePercent,
      unit: "",
      live: false,
    },
    {
      label: "Top loser",
      value: topLoser.symbol,
      change: topLoser.changePercent,
      unit: "",
      live: false,
    },
  ];

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Market Pulse
        </h2>
        <span className="flex items-center gap-1 text-xs text-brand-green">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
          Live
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {tiles.map((tile) => {
          const positive = tile.change > 0;
          const neutral = tile.change === 0;
          return (
            <div
              key={tile.label}
              className="rounded-xl border border-brand-ink/10 bg-card px-3 py-3 relative"
            >
              <div className="flex items-center gap-1 mb-1">
                <p className="text-xs text-muted-foreground truncate">{tile.label}</p>
                {tile.live ? (
                  <span className="w-1 h-1 rounded-full bg-brand-green shrink-0 animate-pulse" title="Live data" />
                ) : (
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30 shrink-0" title="Demo data" />
                )}
              </div>
              <p className="text-base font-bold tabular-nums font-display truncate">
                {tile.value}
                {tile.unit && <span className="text-xs font-normal ml-0.5">{tile.unit}</span>}
              </p>
              {!neutral && (
                <p
                  className={`text-xs tabular-nums font-medium mt-0.5 ${
                    positive ? "text-brand-copper" : "text-red-500"
                  }`}
                >
                  {formatPercent(tile.change)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
