import { fetchUsdZmw } from "@/lib/data/fx";
import { fetchCopperPrice } from "@/lib/data/copper";
import { INSTRUMENTS } from "@/lib/mock/instruments";
import { formatPercent } from "@/lib/format";

type StripTile = {
  label: string;
  value: string;
  change: number | null;
  live: boolean;
};

export async function LiveStrip() {
  const [fx, copper] = await Promise.all([fetchUsdZmw(), fetchCopperPrice()]);

  const zmbeef = INSTRUMENTS.find((i) => i.symbol === "ZAMBEEF");
  const atel = INSTRUMENTS.find((i) => i.symbol === "ATEL");

  const tiles: StripTile[] = [
    { label: "USD/ZMW", value: fx ? fx.rate.toFixed(2) : "27.14", change: null, live: !!fx },
    { label: "Copper USD/lb", value: copper ? copper.priceUsd.toFixed(2) : "4.61", change: copper ? copper.changePercent : null, live: !!copper },
    { label: "LuSE ALSI", value: "4,812.5", change: +0.43, live: false },
    { label: "BoZ Rate", value: "13.50%", change: null, live: false },
    { label: "ATEL", value: atel ? `ZMW ${(atel.lastPriceNgwee / 100).toFixed(2)}` : "ZMW 28.50", change: atel?.changePercent ?? null, live: false },
    { label: "ZAMBEEF", value: zmbeef ? `ZMW ${(zmbeef.lastPriceNgwee / 100).toFixed(2)}` : "ZMW 3.90", change: zmbeef?.changePercent ?? null, live: false },
  ];

  return (
    <div className="bg-brand-ink/95 backdrop-blur-md border-y border-brand-cream/10">
      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-0 divide-x divide-brand-cream/10">
        {tiles.map((tile) => {
          const positive = (tile.change ?? 0) > 0;
          return (
            <div key={tile.label} className="snap-start shrink-0 flex flex-col justify-center px-5 py-4 min-w-[140px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs text-brand-cream/50 whitespace-nowrap">{tile.label}</span>
                {tile.live ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse shrink-0" />
                ) : (
                  <span className="text-[9px] text-brand-cream/30 font-medium shrink-0">Demo</span>
                )}
              </div>
              <p className="text-xl font-bold tabular-nums text-brand-cream font-display">{tile.value}</p>
              {tile.change !== null && (
                <p className={`text-xs tabular-nums font-medium mt-0.5 ${positive ? "text-brand-copper" : "text-red-400"}`}>
                  {formatPercent(tile.change)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
