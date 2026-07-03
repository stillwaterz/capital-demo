"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { OpsNav } from "@/components/ops/ops-nav";
import { opsLogout } from "@/app/ops-login/actions";

export function OpsMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        aria-label="Open operations menu"
        onClick={() => setOpen(true)}
      >
        <Menu size={18} />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="font-display text-left">Operations</SheetTitle>
          </SheetHeader>
          <OpsNav onNavigate={() => setOpen(false)} className="flex-1 px-1" />
          <SheetFooter className="border-t p-3 sm:hidden">
            <form action={opsLogout} className="w-full">
              <Button type="submit" variant="outline" size="sm" className="w-full">
                Sign out
              </Button>
            </form>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
