import Link from "next/link";

const LINKS = {
  Markets: [
    { label: "LuSE Equities", href: "/equities" },
    { label: "Government Bonds", href: "/tbills" },
    { label: "T-Bills", href: "/tbills" },
    { label: "News", href: "/news" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Data Sources", href: "/data-sources" },
  ],
  Legal: [
    { label: "Terms of Use", href: "/terms" },
    { label: "Privacy (DPA Zambia)", href: "/privacy" },
    { label: "Risk Disclosure", href: "/risk" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="bg-brand-ink border-t border-brand-cream/10 pt-14 pb-8 px-6 sm:px-10">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xl font-bold font-display text-brand-cream mb-2">MarketLink</p>
            <p className="text-sm text-brand-cream/50 mb-2">Where Zambia invests.</p>
            <p className="text-sm text-brand-cream/40 leading-relaxed">
              A Pranary product. Trades via Pangaea Securities Limited, SEC-licensed broker.
            </p>
          </div>

          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-cream/40 mb-4">{section}</p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-brand-cream/60 hover:text-brand-cream transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-brand-cream/10 pt-6">
          <p className="text-xs text-brand-cream/30 text-center">
            &copy; 2026 Pranary Institute of Technology Ltd. Lusaka, Zambia. Brokerage by Pangaea Securities Limited (SEC-licensed).
          </p>
        </div>
      </div>
    </footer>
  );
}
