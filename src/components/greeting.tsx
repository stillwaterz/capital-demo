"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/lib/store/user";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function Greeting() {
  const [mounted, setMounted] = useState(false);
  const name = useUserStore((s) => s.name);

  useEffect(() => { setMounted(true); }, []);

  const greeting = getGreeting();
  const text = mounted && name ? `${greeting}, ${name}.` : `${greeting}.`;

  return (
    <div>
      <p className="text-2xl sm:text-3xl font-bold font-display">{text}</p>
      <p className="text-base text-muted-foreground mt-1">
        Here&apos;s what&apos;s happening today.
      </p>
    </div>
  );
}
