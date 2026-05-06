import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background">
      <p className="text-6xl font-bold font-display text-brand-ink/10 mb-4">404</p>
      <h1 className="text-2xl font-bold font-display tracking-tight mb-2">This page is not in our records</h1>
      <p className="text-base text-muted-foreground mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-brand-green hover:bg-brand-green-light text-brand-cream font-medium transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
