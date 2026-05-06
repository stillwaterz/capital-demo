"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/store/user";

export function LoginForm() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const router = useRouter();
  const { login, name } = useUserStore();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phone.length < 9 || pin.length < 4) return;
    login(phone);
    if (name) {
      router.push("/home");
    } else {
      router.push("/welcome");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2">Phone number</label>
        <div className="flex rounded-lg border border-border overflow-hidden focus-within:ring-2 focus-within:ring-ring/50">
          <span className="flex items-center px-4 bg-muted text-muted-foreground text-base font-medium border-r border-border shrink-0">
            +260
          </span>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="97 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
            className="flex-1 px-4 py-3 text-base bg-background outline-none"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">4-digit PIN</label>
        <input
          type="password"
          inputMode="numeric"
          placeholder="••••"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="w-full px-4 py-3 text-base rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-ring/50"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">Any 4 digits work in demo mode.</p>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-brand-green hover:bg-brand-green-light text-brand-cream"
        disabled={phone.length < 9 || pin.length < 4}
      >
        Continue
      </Button>
    </form>
  );
}
