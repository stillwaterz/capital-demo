"use client";

import Link from "next/link";
import { useUserStore } from "@/lib/store/user";

export function LandingNav() {
  const { isLoggedIn } = useUserStore();

  return (
    <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 sm:px-10 h-16">
      <Link href="/" className="text-xl font-bold font-display text-brand-cream tracking-tight">
        MarketLink
      </Link>

      <div className="hidden sm:flex items-center gap-6 text-sm text-brand-cream/60">
        <Link href="#features" className="hover:text-brand-cream transition-colors">Markets</Link>
        <Link href="#features" className="hover:text-brand-cream transition-colors">Government bonds</Link>
        <Link href="#preview" className="hover:text-brand-cream transition-colors">AI</Link>
        <Link href="#cta" className="hover:text-brand-cream transition-colors">Pricing</Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/login"
          className="px-4 py-2 text-sm font-medium text-brand-cream/80 hover:text-brand-cream border border-brand-cream/20 rounded-lg transition-colors"
        >
          Login
        </Link>
        {isLoggedIn ? (
          <Link
            href="/home"
            className="px-4 py-2 text-sm font-medium bg-brand-green hover:bg-brand-green-light text-brand-cream rounded-lg transition-colors"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium bg-brand-green hover:bg-brand-green-light text-brand-cream rounded-lg transition-colors"
          >
            Get started
          </Link>
        )}
      </div>
    </nav>
  );
}
