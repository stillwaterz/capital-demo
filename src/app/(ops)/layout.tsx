import Link from "next/link";
import { OpsNav } from "@/components/ops/ops-nav";
import { ClockControl } from "@/components/ops/clock-control";
import { ModeSwitcher } from "@/components/ops/mode-switcher";
import { OpsCopilot } from "@/components/ops/ops-copilot";
import { Button } from "@/components/ui/button";
import { opsLogout } from "@/app/ops-login/actions";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-4 px-4">
          <Link
            href="/ops"
            className="font-display text-lg font-bold tracking-tight"
          >
            Capital Ops
          </Link>
          <div className="flex items-center gap-3">
            <ClockControl />
            <OpsCopilot />
            <ModeSwitcher />
            <form action={opsLogout}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r bg-card/40 md:block">
          <div className="sticky top-14">
            <OpsNav />
          </div>
        </aside>
        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
