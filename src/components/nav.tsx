"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { useUserStore } from "@/lib/store/user";

const LINKS = [
  { href: "/home", label: "Home" },
  { href: "/equities", label: "Equities" },
  { href: "/tbills", label: "T-Bills" },
  { href: "/news", label: "News" },
  { href: "/ask", label: "Ask" },
] as const;

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { name, isLoggedIn, logout } = useUserStore();

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home";
    return pathname.startsWith(href);
  }

  function handleLogout() {
    logout();
    setOpen(false);
    router.push("/login");
  }

  const initials = name ? name.slice(0, 1).toUpperCase() : "?";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-lg tracking-tight font-display"
          onClick={() => setOpen(false)}
        >
          MarketLink
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive(href)
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
        </nav>

        {/* Mobile menu button */}
        <button
          className="sm:hidden p-2 rounded-md hover:bg-muted"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden border-t bg-background px-4 py-3 flex flex-col gap-1">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`px-3 py-3 rounded-md text-base transition-colors ${
                isActive(href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {label}
            </Link>
          ))}
          {isLoggedIn && (
            <>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-md text-base text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <User size={16} />
                Profile {name ? `(${name})` : ""}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-3 rounded-md text-base text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
