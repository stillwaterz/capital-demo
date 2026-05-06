import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto max-w-4xl px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight font-display">
            MarketLink
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-brand-green hover:underline"
          >
            Sign in
          </Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto max-w-4xl px-6 py-10">
        {children}
      </main>
      <footer className="border-t py-6 text-center">
        <p className="text-xs text-muted-foreground">
          &copy; 2026 Pranary Institute of Technology Ltd. Trades via Pangaea Securities Limited, SEC-licensed.
        </p>
      </footer>
    </div>
  );
}
