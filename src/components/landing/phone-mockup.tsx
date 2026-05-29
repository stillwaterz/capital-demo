export function PhoneMockup() {
  return (
    <div className="relative w-[240px] sm:w-[280px] mx-auto" style={{ transform: "rotate(-8deg)" }}>
      {/* Phone shell */}
      <div className="relative rounded-[2.5rem] bg-brand-ink border-2 border-brand-cream/20 shadow-2xl overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <span className="text-[10px] text-brand-cream/60 font-medium">9:41</span>
          <div className="w-16 h-4 bg-brand-cream/10 rounded-full flex items-center justify-center">
            <div className="w-6 h-1.5 bg-brand-cream/20 rounded-full" />
          </div>
          <div className="flex gap-1 items-center">
            <div className="w-3 h-2 border border-brand-cream/40 rounded-sm relative">
              <div className="absolute inset-0.5 bg-brand-green rounded-sm w-2/3" />
            </div>
          </div>
        </div>

        {/* App content */}
        <div className="px-4 pb-6 space-y-3 bg-[#0f1a12]">
          {/* Greeting */}
          <div className="pt-2">
            <p className="text-[11px] text-brand-cream/50">Good morning, Chanda.</p>
            <p className="text-lg font-bold text-brand-cream font-display tabular-nums">ZMW 1,855,750</p>
            <p className="text-[10px] text-brand-cream/40">Total portfolio value</p>
          </div>

          {/* AI Briefing */}
          <div className="rounded-xl bg-brand-ink border border-brand-green/20 px-3 py-2">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[8px] font-semibold uppercase tracking-wider text-brand-copper">AI Briefing</span>
            </div>
            <p className="text-[10px] text-brand-cream/70 italic leading-relaxed line-clamp-2">
              Zambeef is up 2.9% today after strong half-year results. SCBL goes ex-dividend in 10 days.
            </p>
          </div>

          {/* Holdings */}
          <div className="space-y-1.5">
            {[
              { sym: "ZAMBEEF", val: "ZMW 1,950", chg: "+2.9%", up: true },
              { sym: "SCBL", val: "ZMW 1,040", chg: "-0.4%", up: false },
            ].map((h) => (
              <div key={h.sym} className="flex items-center justify-between rounded-lg bg-brand-cream/5 px-3 py-2">
                <span className="text-[11px] font-semibold text-brand-cream">{h.sym}</span>
                <div className="text-right">
                  <p className="text-[11px] text-brand-cream tabular-nums">{h.val}</p>
                  <p className={`text-[9px] tabular-nums ${h.up ? "text-brand-copper" : "text-red-400"}`}>{h.chg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
