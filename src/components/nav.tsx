"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, Newspaper, Sparkles, User, Landmark } from "lucide-react";
import { useUserStore } from "@/lib/store/user";
import { ModeSwitcher } from "@/components/ops/mode-switcher";

const TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/equities", label: "Stocks", icon: TrendingUp },
  { href: "/tbills", label: "Bills", icon: Landmark },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/ask", label: "Ask", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: User },
] as const;

const DESKTOP_LINKS = TABS.filter((tab) => tab.href !== "/profile");

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home";
  return pathname.startsWith(href);
}

export function Nav() {
  const pathname = usePathname();
  const { name, isLoggedIn } = useUserStore();

  const initials = name ? name.slice(0, 1).toUpperCase() : "?";

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight font-display">
            MarketLink
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {DESKTOP_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive(pathname, href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {label}
              </Link>
            ))}
            {isLoggedIn && (
              <Link
                href="/profile"
                className="ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-brand-green text-brand-cream text-sm font-bold hover:bg-brand-green-light transition-colors"
                title={`${name || "Account"} - Profile`}
              >
                {initials}
              </Link>
            )}
            <ModeSwitcher />
          </nav>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  active ? "text-brand-green" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
