import type { Metadata } from "next";

export const metadata: Metadata = { title: "About - MarketLink" };

export default function AboutPage() {
  return (
    <div className="max-w-2xl space-y-10">
      <section>
        <h1 className="text-4xl font-bold font-display tracking-tight">About MarketLink</h1>
        <p className="text-lg text-muted-foreground mt-3 leading-relaxed">
          MarketLink is an AI-native investment platform built for Zambian retail and diaspora investors. We make the Lusaka Securities Exchange and government securities accessible to anyone with a phone.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display">What we do</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          We give ordinary Zambians access to LuSE equities and GRZ Treasury Bills - the same instruments that institutions and high-net-worth investors have traded for decades. Through AI-powered research, daily briefings and plain-English explanations, we help you understand what you own and why it moves.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          All trades are executed through Pangaea Securities Limited, a broker licensed by the Securities and Exchange Commission of Zambia. MarketLink is the technology and intelligence layer - Pangaea handles the regulated brokerage activity.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display">Built by Pranary</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          MarketLink is a product of Pranary Institute of Technology Ltd, a Zambian technology company focused on financial infrastructure and education. Pranary builds products that serve people who have historically been excluded from formal investment markets.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display">Compliance</h2>
        <ul className="space-y-2 text-base text-muted-foreground">
          <li>Brokerage activity is regulated by the Securities and Exchange Commission of Zambia (SEC) via Pangaea Securities Limited.</li>
          <li>Data privacy follows the Data Protection Act of Zambia 2021. Your data is stored in Zambia.</li>
          <li>Withholding Tax (WHT) on interest and dividends is applied at source at the rate set by ZRA.</li>
          <li>KYC (Know Your Customer) checks are required before any trade is placed.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display">Currently in demo</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          This version of MarketLink is a demo. No real trades are executed and no real money moves. All equity prices are illustrative demo data. The FX rate and news feed are real. We are targeting a live launch later in 2026.
        </p>
      </section>
    </div>
  );
}
