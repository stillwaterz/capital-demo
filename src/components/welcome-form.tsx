"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/store/user";

export function WelcomeForm() {
  const [name, setName] = useState("");
  const router = useRouter();
  const { setName: saveName, completeOnboarding } = useUserStore();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    saveName(trimmed);
    completeOnboarding();
    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input
        type="text"
        placeholder="Your first name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        className="w-full px-4 py-4 text-xl rounded-xl border border-brand-cream/20 bg-brand-cream/10 text-brand-cream placeholder:text-brand-cream/30 outline-none focus:ring-2 focus:ring-brand-green"
        required
      />
      <Button
        type="submit"
        size="lg"
        className="w-full bg-brand-green hover:bg-brand-green-light text-brand-cream"
        disabled={!name.trim()}
      >
        Let&apos;s go
      </Button>
    </form>
  );
}
