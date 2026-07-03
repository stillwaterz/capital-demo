-- Wallet and the append-only ledger.
--
-- ledger_entries is the source of truth and is immutable. wallets is a cached
-- projection of the balance, never authoritative. Every money row carries an
-- idempotency_key so a retried request runs once.

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  account_id uuid not null references public.accounts(id),
  type text not null check (type in (
    'deposit','withdrawal','trade_debit','trade_credit','commission','fee','interest'
  )),
  amount_ngwee bigint not null,
  idempotency_key text not null,
  related_ref text,
  created_at timestamptz not null default now(),
  unique (tenant_id, idempotency_key)
);

create index if not exists ledger_entries_account_idx
  on public.ledger_entries(account_id, created_at);

alter table public.ledger_entries enable row level security;

-- Append-only: no updates, no deletes, ever.
create trigger ledger_entries_no_update
  before update on public.ledger_entries
  for each row execute function app.block_mutations();
create trigger ledger_entries_no_delete
  before delete on public.ledger_entries
  for each row execute function app.block_mutations();

create policy ledger_entries_select on public.ledger_entries
  for select using (app.owns_account(account_id));

-- Entries are posted by the server (staff/service context), not by clients.
create policy ledger_entries_insert on public.ledger_entries
  for insert with check (
    tenant_id = app.current_tenant_id() and app.is_staff()
  );

-- ---------------------------------------------------------------------------

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  account_id uuid not null references public.accounts(id) unique,
  balance_ngwee bigint not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists wallets_tenant_idx on public.wallets(tenant_id);

create trigger wallets_touch_updated_at
  before update on public.wallets
  for each row execute function app.touch_updated_at();

alter table public.wallets enable row level security;

create policy wallets_select on public.wallets
  for select using (app.owns_account(account_id));

create policy wallets_upsert on public.wallets
  for insert with check (
    tenant_id = app.current_tenant_id() and app.is_staff()
  );

create policy wallets_update on public.wallets
  for update using (tenant_id = app.current_tenant_id() and app.is_staff());
