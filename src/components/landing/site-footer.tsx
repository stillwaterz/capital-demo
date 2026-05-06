import Link from "next/link";
import { ExternalLink } from "lucide-react";

const SOCIAL = [
  { label: "X / Twitter", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "Instagram", href: "#" },
];

const LINKS = {
  Markets: [
    { label: "LuSE Equities", href: "/equities" },
    { label: "Government Bonds", href: "/tbills" },
    { label: "T-Bills", href: "/tbills" },
    { label: "News", href: "/news" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Pranary", href: "#" },
    { label: "Pangaea Securities", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Terms", href: "#" },
    { label: "Privacy (DPA Zambia)", href: "#" },
    { label: "Risk Disclosure", href: "#" },
    { label: "Data Sources", href: "/data-sources" },
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
            <p className="text-sm text-brand-cream/50 mb-6">Where Zambia invests.</p>
            <div className="flex gap-3">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg border border-brand-cream/10 flex items-center justify-center text-brand-cream/40 hover:text-brand-cream hover:border-brand-cream/30 transition-colors"
                >
                  <ExternalLink size={13} />
                </a>
              ))}
            </div>
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
            MarketLink is a Pranary product. Trades executed through Pangaea Securities Limited, a SEC-licensed broker.
            {" "}&copy; 2026 Pranary Institute of Technology Ltd.
          </p>
        </div>
      </div>
    </footer>
  );
}
