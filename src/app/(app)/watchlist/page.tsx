"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { INSTRUMENTS, getInstrument } from "@/lib/mock/instruments";
import { formatZMW, formatPercent } from "@/lib/format";
import { useWatchlistStore } from "@/lib/store/watchlist";
import {
  usePriceAlertsStore,
  evaluateAlerts,
  type AlertDirection,
} from "@/lib/store/price-alerts";
import {
  useAutoInvestStore,
  monthlyEquivalentNgwee,
  type Cadence,
} from "@/lib/store/auto-invest";
import { referralCode, REFERRAL_REWARD_NGWEE } from "@/lib/referrals";

const NGWEE_PER_KWACHA = 100;
const DEMO_REFERRER_NAME = "Chanda M.";
const FIRST_SYMBOL = INSTRUMENTS[0]?.symbol ?? "";

function kwachaToNgwee(kwacha: string): number {
  const value = Number(kwacha);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * NGWEE_PER_KWACHA);
}

const PRICE_BY_SYMBOL: Record<string, number> = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.symbol, i.lastPriceNgwee])
);

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
      {children}
    </h2>
  );
}

function EmptyNote({ children }: { children: string }) {
  return <p className="text-sm text-muted-foreground py-2">{children}</p>;
}

function InstrumentSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (symbol: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {INSTRUMENTS.map((i) => (
        <option key={i.symbol} value={i.symbol}>
          {i.symbol} - {i.name}
        </option>
      ))}
    </select>
  );
}

function ChangeLabel({ pct }: { pct: number }) {
  const tone = pct >= 0 ? "text-brand-copper" : "text-red-600";
  return <span className={`tabular-nums ${tone}`}>{formatPercent(pct)}</span>;
}

function WatchlistRow({ symbol }: { symbol: string }) {
  const remove = useWatchlistStore((s) => s.remove);
  const instrument = getInstrument(symbol);
  if (!instrument) return null;
  return (
    <Card className="border border-brand-ink/10">
      <CardContent className="py-4 px-5 flex items-center justify-between min-h-16">
        <div>
          <p className="font-semibold text-brand-ink">{instrument.symbol}</p>
          <p className="text-sm text-muted-foreground">{instrument.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-medium tabular-nums">
              {formatZMW(instrument.lastPriceNgwee)}
            </p>
            <p className="text-sm">
              <ChangeLabel pct={instrument.changePercent} />
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => remove(symbol)}>
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WatchlistSection() {
  const symbols = useWatchlistStore((s) => s.symbols);
  const add = useWatchlistStore((s) => s.add);
  const [choice, setChoice] = useState(FIRST_SYMBOL);
  return (
    <section>
      <SectionHeading>Your watchlist</SectionHeading>
      <div className="flex items-center gap-2 mb-3">
        <InstrumentSelect value={choice} onChange={setChoice} />
        <Button size="sm" onClick={() => add(choice)}>
          Add to watchlist
        </Button>
      </div>
      {symbols.length === 0 ? (
        <EmptyNote>You are not watching any shares yet. Add one above.</EmptyNote>
      ) : (
        <div className="space-y-3">
          {symbols.map((symbol) => (
            <WatchlistRow key={symbol} symbol={symbol} />
          ))}
        </div>
      )}
    </section>
  );
}

function AlertRow({
  id,
  symbol,
  direction,
  targetNgwee,
  triggered,
}: {
  id: string;
  symbol: string;
  direction: AlertDirection;
  targetNgwee: number;
  triggered: boolean;
}) {
  const remove = usePriceAlertsStore((s) => s.remove);
  const word = direction === "above" ? "rises above" : "falls below";
  return (
    <Card className="border border-brand-ink/10">
      <CardContent className="py-3 px-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-brand-ink">{symbol}</p>
          <p className="text-sm text-muted-foreground">
            When price {word} {formatZMW(targetNgwee)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {triggered ? (
            <Badge variant="default">Triggered</Badge>
          ) : (
            <Badge variant="outline">Watching</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={() => remove(id)}>
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertForm() {
  const add = usePriceAlertsStore((s) => s.add);
  const [symbol, setSymbol] = useState(FIRST_SYMBOL);
  const [direction, setDirection] = useState<AlertDirection>("above");
  const [target, setTarget] = useState("");
  function submit() {
    const targetNgwee = kwachaToNgwee(target);
    if (targetNgwee === 0) return;
    add({ symbol, direction, targetNgwee });
    setTarget("");
  }
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <InstrumentSelect value={symbol} onChange={setSymbol} />
      <select
        value={direction}
        onChange={(e) => setDirection(e.target.value as AlertDirection)}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="above">Rises above</option>
        <option value="below">Falls below</option>
      </select>
      <Input
        type="number"
        inputMode="decimal"
        placeholder="Price in ZMW"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="w-36"
      />
      <Button size="sm" onClick={submit}>
        Add alert
      </Button>
    </div>
  );
}

function AlertsSection() {
  const alerts = usePriceAlertsStore((s) => s.alerts);
  const triggered = useMemo(
    () => new Set(evaluateAlerts(alerts, PRICE_BY_SYMBOL).map((a) => a.id)),
    [alerts]
  );
  return (
    <section>
      <SectionHeading>Price alerts</SectionHeading>
      <AlertForm />
      {alerts.length === 0 ? (
        <EmptyNote>No price alerts yet. Set one to get a nudge.</EmptyNote>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <AlertRow
              key={a.id}
              id={a.id}
              symbol={a.symbol}
              direction={a.direction}
              targetNgwee={a.targetNgwee}
              triggered={triggered.has(a.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PlanRow({
  id,
  symbol,
  amountNgwee,
  cadence,
  active,
}: {
  id: string;
  symbol: string;
  amountNgwee: number;
  cadence: Cadence;
  active: boolean;
}) {
  const remove = useAutoInvestStore((s) => s.remove);
  const toggle = useAutoInvestStore((s) => s.toggle);
  const monthly = monthlyEquivalentNgwee({ id, symbol, amountNgwee, cadence, active });
  return (
    <Card className="border border-brand-ink/10">
      <CardContent className="py-3 px-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-brand-ink">{symbol}</p>
          <p className="text-sm text-muted-foreground">
            {formatZMW(amountNgwee)} {cadence}. About {formatZMW(monthly)} a month.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={active ? "default" : "outline"}>
            {active ? "Active" : "Paused"}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => toggle(id)}>
            {active ? "Pause" : "Resume"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => remove(id)}>
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AutoInvestForm() {
  const add = useAutoInvestStore((s) => s.add);
  const [symbol, setSymbol] = useState(FIRST_SYMBOL);
  const [amount, setAmount] = useState("");
  const [cadence, setCadence] = useState<Cadence>("monthly");
  function submit() {
    const amountNgwee = kwachaToNgwee(amount);
    if (amountNgwee === 0) return;
    add({ symbol, amountNgwee, cadence });
    setAmount("");
  }
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <InstrumentSelect value={symbol} onChange={setSymbol} />
      <Input
        type="number"
        inputMode="decimal"
        placeholder="Amount in ZMW"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-36"
      />
      <select
        value={cadence}
        onChange={(e) => setCadence(e.target.value as Cadence)}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>
      <Button size="sm" onClick={submit}>
        Start plan
      </Button>
    </div>
  );
}

function AutoInvestSection() {
  const plans = useAutoInvestStore((s) => s.plans);
  return (
    <section>
      <SectionHeading>Auto invest</SectionHeading>
      <AutoInvestForm />
      {plans.length === 0 ? (
        <EmptyNote>No plans yet. Set one to invest little and often.</EmptyNote>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <PlanRow
              key={p.id}
              id={p.id}
              symbol={p.symbol}
              amountNgwee={p.amountNgwee}
              cadence={p.cadence}
              active={p.active}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ReferralCard() {
  const code = referralCode(DEMO_REFERRER_NAME);
  return (
    <section>
      <SectionHeading>Invite a friend</SectionHeading>
      <Card className="border border-brand-green/30">
        <CardContent className="py-5 px-5">
          <p className="text-sm text-muted-foreground">Your referral code</p>
          <p className="text-2xl font-semibold tracking-wide text-brand-ink mt-1">
            {code}
          </p>
          <p className="text-sm mt-3">
            Share your code. You both get{" "}
            <span className="font-medium text-brand-green">
              {formatZMW(REFERRAL_REWARD_NGWEE)}
            </span>{" "}
            when your friend funds their account.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

export default function WatchlistPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          Watchlist and habits
        </h1>
        <p className="text-sm text-muted-foreground">
          Watch shares, set price alerts, invest little and often and invite
          friends.
        </p>
      </header>
      {mounted ? (
        <>
          <WatchlistSection />
          <AlertsSection />
          <AutoInvestSection />
          <ReferralCard />
        </>
      ) : (
        <LoadingState />
      )}
    </div>
  );
}
