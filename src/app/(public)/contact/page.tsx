import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact - MarketLink" };

export default function ContactPage() {
  return (
    <div className="max-w-2xl space-y-10">
      <section>
        <h1 className="text-4xl font-bold font-display tracking-tight">Contact</h1>
        <p className="text-lg text-muted-foreground mt-3 leading-relaxed">
          We are a small team. We read every message and respond within one business day.
        </p>
      </section>

      <section className="space-y-6">
        <div className="border border-border rounded-2xl p-6 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">General enquiries</p>
          <p className="text-base font-medium">hello@pranary.com</p>
          <p className="text-sm text-muted-foreground">For questions about MarketLink, the demo or our roadmap.</p>
        </div>

        <div className="border border-border rounded-2xl p-6 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Brokerage and account questions</p>
          <p className="text-base font-medium">Pangaea Securities Limited</p>
          <p className="text-sm text-muted-foreground">
            For questions about trade execution, account opening or compliance, contact our licensed brokerage partner Pangaea Securities Limited, SEC-registered broker in Zambia.
          </p>
        </div>

        <div className="border border-border rounded-2xl p-6 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Data and privacy</p>
          <p className="text-base font-medium">privacy@pranary.com</p>
          <p className="text-sm text-muted-foreground">To request data deletion, access your data or raise a DPA Zambia concern.</p>
        </div>

        <div className="border border-border rounded-2xl p-6 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Office</p>
          <p className="text-base font-medium">Lusaka, Zambia</p>
          <p className="text-sm text-muted-foreground">We are based in Lusaka. Physical meeting by appointment only.</p>
        </div>
      </section>
    </div>
  );
}
