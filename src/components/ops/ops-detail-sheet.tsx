"use client";

import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** One label/value pair rendered in the detail drawer body. */
export type DetailField = {
  label: string;
  value: ReactNode;
  /** Render the value in a tabular-nums, mono-friendly style for figures. */
  mono?: boolean;
};

/**
 * Reusable right-hand detail drawer for ops entities. Boards keep a piece of
 * state for the selected row and pass its fields here, so every list row can
 * open a consistent detail view without a bespoke dialog per board.
 */
export function OpsDetailSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  badge,
  fields,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  fields?: readonly DetailField[];
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b p-5 pr-12">
          <div className="flex items-start justify-between gap-3">
            <SheetTitle className="font-display text-lg font-semibold tracking-tight">
              {title}
            </SheetTitle>
            {badge ? <div className="shrink-0">{badge}</div> : null}
          </div>
          {subtitle ? (
            <SheetDescription className="leading-relaxed">
              {subtitle}
            </SheetDescription>
          ) : null}
        </SheetHeader>

        {fields && fields.length > 0 ? (
          <dl className="divide-y">
            {fields.map((field, index) => (
              <div
                key={`${field.label}-${index}`}
                className="flex items-start justify-between gap-6 px-5 py-3"
              >
                <dt className="text-sm text-muted-foreground">{field.label}</dt>
                <dd
                  className={cn(
                    "text-right text-sm font-medium text-foreground",
                    field.mono && "tabular-nums"
                  )}
                >
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {children ? <div className="px-5 py-4">{children}</div> : null}

        {footer ? (
          <SheetFooter className="border-t p-5">{footer}</SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
