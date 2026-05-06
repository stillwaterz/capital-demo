import Link from "next/link";

export function FinalCtaSection() {
  return (
    <section id="cta" className="bg-brand-green py-20 sm:py-28 px-6 sm:px-10">
      <div className="container mx-auto max-w-3xl text-center">
        <h2 className="text-5xl sm:text-6xl font-bold font-display text-brand-cream leading-tight mb-5">
          Start investing in 2 minutes.
        </h2>
        <p className="text-xl text-brand-cream/80 mb-10">
          Free to download. Mobile money KYC. No paperwork.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center h-14 px-10 text-lg font-semibold bg-brand-ink text-brand-cream hover:bg-brand-ink/80 rounded-xl transition-colors"
        >
          Get started
        </Link>
        <p className="text-base text-brand-cream/60 mt-5">
          Available on iPhone, Android and web.
        </p>
      </div>
    </section>
  );
}
