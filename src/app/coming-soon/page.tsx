import Link from "next/link";

export default function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string }>;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-green mb-6">
        <span className="text-brand-cream font-display font-bold text-2xl">M</span>
      </div>
      <h1 className="text-3xl font-bold font-display tracking-tight mb-3">We are building this</h1>
      <p className="text-base text-muted-foreground max-w-sm leading-relaxed mb-8">
        This feature is not ready yet. We are working on it and will notify you when it launches.
      </p>
      <div className="flex gap-3">
        <Link
          href="/home"
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-brand-green hover:bg-brand-green-light text-brand-cream font-medium transition-colors"
        >
          Back to home
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 font-medium transition-colors"
        >
          Landing page
        </Link>
      </div>
    </div>
  );
}
