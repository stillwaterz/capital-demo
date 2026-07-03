-- Contract notes (hash-chained, sequentially numbered) and the holdings projection.

create table if not exists public.contract_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  account_id uuid not null references public.accounts(id),
  order_id uuid not null references public.orders(id),
  execution_id uuid not null references public.executions(id),
  sequential_number bigint not null,
  payload jsonb not null,
  hash text not null,
  prev_hash text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  -- Sequential numbering per tenant with gap detection built on the unique key.
  unique (tenant_id, sequential_number),
  unique (tenant_id, hash)
);

create index if not exists contract_notes_account_idx on public.contract_notes(account_id);

alter table public.contract_notes enable row level security;

-- Notes are statutory records. Append-only, delivered_at is set via a separate
-- delivery row in a later task rather than mutating the note.
create trigger contract_notes_no_update
  before update on public.contract_notes
  for each row execute function app.block_mutations();
create trigger contract_notes_no_delete
  before delete on public.contract_notes
  for each row execute function app.block_mutations();

create policy contract_notes_select on public.contract_notes
  for select using (app.owns_account(account_id));
create policy contract_notes_insert on public.contract_notes
  for insert with check (
    tenant_id = app.current_tenant_id() and app.is_staff()
  );

-- ---------------------------------------------------------------------------

create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  account_id uuid not null references public.accounts(id),
  instrument_id uuid not null references public.instruments(id),
  qty integer not null default 0 check (qty >= 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (account_id, instrument_id)
);

create index if not exists holdings_account_idx on public.holdings(account_id);

create trigger holdings_touch_updated_at
  before update on public.holdings
  for each row execute function app.touch_updated_at();

alter table public.holdings enable row level security;

-- Projection derived from settled executions. Clients read, staff/service write.
create policy holdings_select on public.holdings
  for select using (app.owns_account(account_id));
create policy holdings_write on public.holdings
  for all using (tenant_id = app.current_tenant_id() and app.is_staff())
  with check (tenant_id = app.current_tenant_id() and app.is_staff());
