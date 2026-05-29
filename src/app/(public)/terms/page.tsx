import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Use - MarketLink" };

export default function TermsPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <section>
        <h1 className="text-4xl font-bold font-display tracking-tight">Terms of Use</h1>
        <p className="text-sm text-muted-foreground mt-2">Last updated: May 2026. Demo version.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">1. Demo disclaimer</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          This platform is currently operating in demo mode. No real trades are executed, no real money is transferred and no real securities are bought or sold. All equity prices are illustrative. FX and news data are real. By using this demo you agree that it is for evaluation purposes only.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">2. Who we are</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          MarketLink is a product of Pranary Institute of Technology Ltd, a company incorporated in Zambia. Brokerage services are provided by Pangaea Securities Limited, licensed by the Securities and Exchange Commission of Zambia. Pranary operates the technology platform. Pangaea holds client assets, executes trades and maintains the regulated brokerage relationship.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">3. Not financial advice</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Nothing on this platform constitutes financial advice. AI-generated briefings, research summaries and suggestions are for information only. Before investing, consider your personal financial situation and risk tolerance. Past performance does not guarantee future returns.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">4. Eligibility</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          You must be 18 or older and a Zambian citizen or resident to open a live account. Diaspora investors must comply with applicable laws in their country of residence. KYC verification is required before trading.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">5. Risks</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Investing in LuSE equities carries risk. You may receive less than you invest. Equity prices can fall as well as rise. Currency movements may affect returns. Always read the Risk Disclosure before investing.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">6. Changes</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          We may update these terms before the live launch. We will notify registered users by email or in-app notification of material changes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">7. Governing law</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          These terms are governed by the laws of the Republic of Zambia. Disputes are subject to the jurisdiction of Zambian courts.
        </p>
      </section>
    </div>
  );
}
