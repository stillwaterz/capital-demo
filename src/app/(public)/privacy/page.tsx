import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy - MarketLink" };

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <section>
        <h1 className="text-4xl font-bold font-display tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mt-2">Last updated: May 2026. Compliant with the Data Protection Act of Zambia 2021.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">What we collect</h2>
        <ul className="space-y-2 text-base text-muted-foreground">
          <li>Phone number and name when you register.</li>
          <li>KYC documents (NRC or passport, proof of address) when you verify your account.</li>
          <li>Transaction records including orders placed and portfolio holdings.</li>
          <li>Device information and usage data to improve the platform.</li>
          <li>Questions you ask the AI assistant, to improve AI quality.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">How we use your data</h2>
        <ul className="space-y-2 text-base text-muted-foreground">
          <li>To operate your account and execute your instructions.</li>
          <li>To verify your identity as required by Zambian law.</li>
          <li>To detect and prevent fraud and money laundering.</li>
          <li>To send you account notifications and market updates you have opted into.</li>
          <li>To improve MarketLink products and services.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Data residency</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Your personal data is stored in Zambia in accordance with the Data Protection Act 2021. We do not transfer your personal data outside Zambia without your consent except where required by law or where a processor provides adequate protections.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Who we share data with</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          We share your data with Pangaea Securities Limited solely for the purpose of executing trades and maintaining your brokerage account. We do not sell your personal data to third parties. We may be required to share data with regulators including the SEC, BoZ, ZRA and law enforcement under Zambian law.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Your rights</h2>
        <ul className="space-y-2 text-base text-muted-foreground">
          <li>You have the right to access the personal data we hold about you.</li>
          <li>You have the right to correct inaccurate data.</li>
          <li>You have the right to request deletion of your data (subject to regulatory retention obligations).</li>
          <li>You have the right to withdraw consent for marketing communications at any time.</li>
        </ul>
        <p className="text-base text-muted-foreground">To exercise these rights, email privacy@pranary.com.</p>
      </section>
    </div>
  );
}
