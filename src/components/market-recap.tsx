import { TrendingUp, TrendingDown, Calendar } from "lucide-react";

const REPORT_DATE = "6 May 2026";
const REPORT_SOURCE = "Money Acumen Advisory & Brokers / LuSE Daily Report";

const LUSE_ASI = { value: 26_680.94, change: -0.15 };

const TOP_MOVERS = [
  { symbol: "NATB",   price: "K2.68",  change: +5.92, board: "main" },
  { symbol: "CHIL",   price: "K69.00", change: +0.95, board: "main" },
  { symbol: "ZCCM",   price: "K160.00", change: -3.03, board: "main" },
  { symbol: "SCBL",   price: "K1.27",  change: -0.78, board: "main" },
];

const FX_RATES = [
  { pair: "USD/ZMW", mid: 18.845 },
  { pair: "GBP/ZMW", mid: 25.527 },
  { pair: "EUR/ZMW", mid: 22.030 },
  { pair: "ZAR/ZMW", mid: 1.131 },
];

const AFRICAN_INDICES = [
  { name: "LuSE ASI", value: "26,680.94", change: -0.15 },
  { name: "JSE ASI",  value: "115,180.53", change: +1.15 },
  { name: "MSE ASI",  value: "524,132.49", change: -0.02 },
  { name: "GSE-CI",   value: "15,130.52",  change: +0.21 },
  { name: "EGX 30",   value: "51,760.97",  change: -1.19 },
  { name: "BSE DCI",  value: "11,130.96",  change: 0.00 },
];

export function MarketRecap() {
  const gainers = TOP_MOVERS.filter((m) => m.change > 0);
  const decliners = TOP_MOVERS.filter((m) => m.change < 0);
  const asiPositive = LUSE_ASI.change >= 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          End of Day Report
        </h2>
        <span className="text-xs text-muted-foreground">{REPORT_DATE}</span>
      </div>

      <div className="rounded-2xl bg-brand-ink text-brand-cream overflow-hidden">
        {/* LuSE ASI header */}
        <div className="px-5 py-4 border-b border-brand-cream/10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-cream/50 mb-1">LuSE All Share Index</p>
              <p className="text-4xl font-bold font-display tabular-nums">
                {LUSE_ASI.value.toLocaleString("en-ZM", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold tabular-nums ${asiPositive ? "bg-brand-copper/20 text-brand-copper" : "bg-red-500/20 text-red-400"}`}>
              {asiPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {asiPositive ? "+" : ""}{LUSE_ASI.change}%
            </div>
          </div>
        </div>

        {/* Top movers */}
        <div className="grid grid-cols-2 divide-x divide-brand-cream/10 border-b border-brand-cream/10">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-green mb-2">Top Gainers</p>
            <div className="space-y-2">
              {gainers.map((m) => (
                <div key={m.symbol} className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{m.symbol}</p>
                  <div className="text-right">
                    <p className="text-xs text-brand-cream/60">{m.price}</p>
                    <p className="text-xs font-semibold text-brand-copper tabular-nums">+{m.change}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-2">Top Decliners</p>
            <div className="space-y-2">
              {decliners.map((m) => (
                <div key={m.symbol} className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{m.symbol}</p>
                  <div className="text-right">
                    <p className="text-xs text-brand-cream/60">{m.price}</p>
                    <p className="text-xs font-semibold text-red-400 tabular-nums">{m.change}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FX rates */}
        <div className="px-5 py-3 border-b border-brand-cream/10">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-cream/50 mb-2">FX (mid rate)</p>
          <div className="grid grid-cols-4 gap-2">
            {FX_RATES.map((fx) => (
              <div key={fx.pair}>
                <p className="text-xs text-brand-cream/50">{fx.pair.split("/")[0]}</p>
                <p className="text-sm font-semibold tabular-nums">{fx.mid.toFixed(3)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* African indices */}
        <div className="px-5 py-3 border-b border-brand-cream/10">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-cream/50 mb-2">African Markets</p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-2">
            {AFRICAN_INDICES.map((idx) => {
              const pos = idx.change > 0;
              const flat = idx.change === 0;
              return (
                <div key={idx.name}>
                  <p className="text-xs text-brand-cream/50">{idx.name}</p>
                  <p className={`text-xs font-semibold tabular-nums ${flat ? "text-brand-cream/60" : pos ? "text-brand-copper" : "text-red-400"}`}>
                    {flat ? "0.00%" : `${pos ? "+" : ""}${idx.change}%`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next event + source */}
        <div className="px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-brand-cream/60">
            <Calendar size={13} />
            <p className="text-xs">Next MPC meeting - 26 Jun 2026</p>
          </div>
          <p className="text-xs text-brand-cream/30 text-right leading-tight">
            {REPORT_SOURCE}
          </p>
        </div>
      </div>
    </section>
  );
}
