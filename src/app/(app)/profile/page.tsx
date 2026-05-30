"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/lib/store/user";
import { useCustomerWalletStore } from "@/lib/store/customer-wallet";
import { FundWalletDialog } from "@/components/fund-wallet-dialog";
import { formatZMW } from "@/lib/format";
import { LogOut, User, Phone, Shield, CreditCard, FileText, Wallet } from "lucide-react";

const MOCK_PAYMENT_METHODS = [
  { label: "Airtel Money", detail: "+260 9XX XXX XXX", active: true },
  { label: "MTN MoMo", detail: "+260 9XX XXX XXX", active: true },
  { label: "FNB Account", detail: "•••• •••• 4821", active: false },
];

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const router = useRouter();
  const { name, phone, isLoggedIn, logout, setName } = useUserStore();
  const balanceNgwee = useCustomerWalletStore((s) => s.balanceNgwee);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");

  useEffect(() => { setMounted(true); }, []);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draftName.trim();
    if (!trimmed) return;
    setName(trimmed);
    setEditing(false);
  }

  if (!mounted) return null;

  const displayName = name || "Guest";
  const initials = displayName.slice(0, 1).toUpperCase();
  const maskedPhone = phone ? `+260 ${phone.slice(0, 2)}X XXX ${phone.slice(-3)}` : null;

  return (
    <div className="space-y-6 max-w-sm mx-auto">
      <section>
        <h1 className="text-3xl font-bold tracking-tight font-display">Profile</h1>
        <p className="text-base text-muted-foreground mt-1">Your account details.</p>
      </section>

      {/* Avatar */}
      <div className="flex flex-col items-center py-4">
        <div className="w-20 h-20 rounded-full bg-brand-green flex items-center justify-center text-brand-cream text-3xl font-bold font-display mb-3">
          {initials}
        </div>
        <p className="text-xl font-semibold">{displayName}</p>
        {maskedPhone && <p className="text-sm text-muted-foreground mt-0.5">{maskedPhone}</p>}
        <div className="flex gap-2 mt-3">
          <Badge className="text-xs bg-brand-copper/10 text-brand-copper border-brand-copper/20">KYC Tier 1</Badge>
          <Badge variant="outline" className="text-xs">Demo account</Badge>
        </div>
      </div>

      {/* Wallet */}
      <Card className="border border-brand-ink/10">
        <CardContent className="py-5 px-5 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet size={15} />
            <span className="text-xs font-semibold uppercase tracking-widest">Cash wallet</span>
          </div>
          <p className="text-2xl font-bold font-display tabular-nums">
            {formatZMW(balanceNgwee)}
          </p>
          <Button
            type="button"
            className="w-full bg-brand-green hover:bg-brand-green-light text-brand-cream"
            onClick={() => setFundOpen(true)}
          >
            Fund wallet
          </Button>
          <p className="text-xs text-muted-foreground">
            Demo deposit via Airtel Money. Funds appear in ops treasury float.
          </p>
        </CardContent>
      </Card>

      <FundWalletDialog open={fundOpen} onClose={() => setFundOpen(false)} />

      {/* Display name */}
      <Card className="border border-brand-ink/10">
        <CardContent className="py-5 px-5 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User size={15} />
            <span className="text-xs font-semibold uppercase tracking-widest">Display name</span>
          </div>
          {editing ? (
            <form onSubmit={handleSaveName} className="flex gap-2">
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder={displayName}
                className="flex-1 px-3 py-2 text-base rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-ring/50"
              />
              <Button type="submit" size="sm" className="bg-brand-green hover:bg-brand-green-light text-brand-cream">Save</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-base font-medium">{displayName}</p>
              <button onClick={() => { setDraftName(displayName); setEditing(true); }} className="text-sm text-brand-green hover:underline">Edit</button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phone */}
      {maskedPhone && (
        <Card className="border border-brand-ink/10">
          <CardContent className="py-5 px-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Phone size={15} />
              <span className="text-xs font-semibold uppercase tracking-widest">Phone</span>
            </div>
            <p className="text-base font-medium">{maskedPhone}</p>
            <p className="text-sm text-muted-foreground mt-0.5">Used to log in. Contact support to change.</p>
          </CardContent>
        </Card>
      )}

      {/* KYC + account status */}
      <Card className="border border-brand-ink/10">
        <CardContent className="py-5 px-5 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield size={15} />
            <span className="text-xs font-semibold uppercase tracking-widest">Account status</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm">KYC tier</p>
              <Badge className="text-xs bg-brand-copper/10 text-brand-copper border-brand-copper/20">Tier 1 - Demo</Badge>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm">Risk profile</p>
              <span className="text-sm text-muted-foreground">Balanced (demo)</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm">Investment goal</p>
              <span className="text-sm text-muted-foreground">Long-term growth (demo)</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            This is a demo account. No real money is involved and no trades are executed.
          </p>
        </CardContent>
      </Card>

      {/* Linked payment methods */}
      <Card className="border border-brand-ink/10">
        <CardContent className="py-5 px-5 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard size={15} />
            <span className="text-xs font-semibold uppercase tracking-widest">Payment methods</span>
          </div>
          <div className="space-y-2.5">
            {MOCK_PAYMENT_METHODS.map((m) => (
              <div key={m.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.detail}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${m.active ? "bg-brand-green/10 text-brand-green" : "bg-muted text-muted-foreground"}`}>
                  {m.active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Demo data. Live payment methods on launch.</p>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card className="border border-brand-ink/10">
        <CardContent className="py-5 px-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <FileText size={15} />
            <span className="text-xs font-semibold uppercase tracking-widest">Documents</span>
          </div>
          <a href="/coming-soon" className="flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span>NRC / Passport</span>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Coming soon</span>
          </a>
          <a href="/coming-soon" className="flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span>Proof of address</span>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Coming soon</span>
          </a>
          <a href="/coming-soon" className="flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span>Account statements</span>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Coming soon</span>
          </a>
        </CardContent>
      </Card>

      {/* Sign out */}
      {isLoggedIn && (
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          <LogOut size={16} />
          Sign out
        </Button>
      )}
    </div>
  );
}
