"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore, PIN_LENGTH } from "@/lib/store/user";

const TWO_FACTOR_LENGTH = 6;

type Props = {
  /** Plain-English action being confirmed, for example "Buy 500 ZANACO". */
  action: string;
  onConfirmed: () => void;
  onCancel: () => void;
};

/**
 * PIN and optional second-factor gate.
 *
 * Every money movement and order release is confirmed by the client here, never
 * by the AI (golden rule 2). Demo only: the PIN defaults to 1234 and any six
 * digit code passes the second factor. Real auth binds Supabase in production.
 */
export function PinConfirm({ action, onConfirmed, onCancel }: Props) {
  const verifyPin = useUserStore((s) => s.verifyPin);
  const twoFactorEnabled = useUserStore((s) => s.twoFactorEnabled);
  const [pin, setPin] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const codeReady = !twoFactorEnabled || code.length === TWO_FACTOR_LENGTH;
  const ready = pin.length === PIN_LENGTH && codeReady;

  function handleConfirm() {
    if (!verifyPin(pin)) {
      setError("That PIN is not right. Try again.");
      setPin("");
      return;
    }
    if (twoFactorEnabled && code.length !== TWO_FACTOR_LENGTH) {
      setError("Enter the 6 digit code from your phone.");
      return;
    }
    setError(null);
    onConfirmed();
  }

  return (
    <div className="space-y-4 py-2">
      <div>
        <p className="text-sm font-medium">Confirm with your PIN</p>
        <p className="text-xs text-muted-foreground mt-0.5">{action}</p>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">PIN</label>
        <Input
          type="password"
          inputMode="numeric"
          maxLength={PIN_LENGTH}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="4 digit PIN"
          autoFocus
        />
      </div>

      {twoFactorEnabled && (
        <div>
          <label className="text-sm font-medium mb-1 block">
            2FA code
          </label>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={TWO_FACTOR_LENGTH}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="6 digit code"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Demo only. Any 6 digits pass. PIN is 1234.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={!ready}>
          Confirm
        </Button>
      </div>
    </div>
  );
}
