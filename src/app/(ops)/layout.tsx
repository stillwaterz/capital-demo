import Link from "next/link";
import { OpsNav } from "@/components/ops/ops-nav";
import { ClockControl } from "@/components/ops/clock-control";
import { ModeSwitcher } from "@/components/ops/mode-switcher";
import { OpsCopilot } from "@/components/ops/ops-copilot";
import { OpsMobileNav } from "@/components/ops/ops-mobile-nav";
import { OpsStatusBar } from "@/components/ops/ops-status-bar";
import { Button } from "@/components/ui/button";
import { opsLogout } from "@/app/ops-login/actions";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <OpsMobileNav />
            <Link
              href="/ops"
              className="truncate font-display text-lg font-bold tracking-tight"
            >
              Capital Ops
            </Link>
          </div>

          <div className="hidden flex-1 justify-center md:flex">
            <OpsStatusBar />
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ClockControl />
            <OpsCopilot />
            <ModeSwitcher />
            <form action={opsLogout} className="hidden sm:block">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t px-4 py-2 md:hidden">
          <OpsStatusBar />
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r bg-card/60 md:block">
          <div className="sticky top-[3.5rem] max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <OpsNav />
          </div>
        </aside>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
