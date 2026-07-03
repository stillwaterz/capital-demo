-- settlements: the T+n cycle for a filled execution, both legs tracked on a
-- delivery-versus-payment basis. cycle_days is config, T+3 today.

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  account_id uuid not null references public.accounts(id),
  execution_id uuid not null references public.executions(id) unique,
  cycle_days integer not null check (cycle_days >= 0),
  trade_date date not null,
  settlement_date date not null,
  cash_leg_status text not null default 'pending'
    check (cash_leg_status in ('pending','settled','failed')),
  stock_leg_status text not null default 'pending'
    check (stock_leg_status in ('pending','settled','failed')),
  status text not null default 'pending'
    check (status in ('pending','settled','partial','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists settlements_account_idx on public.settlements(account_id);
create index if not exists settlements_date_idx on public.settlements(tenant_id, settlement_date);

create trigger settlements_touch_updated_at
  before update on public.settlements
  for each row execute function app.touch_updated_at();

alter table public.settlements enable row level security;

-- The client sees a plain tracker. Operations reconcile both legs.
create policy settlements_select on public.settlements
  for select using (app.owns_account(account_id));
create policy settlements_write on public.settlements
  for all using (tenant_id = app.current_tenant_id() and app.is_staff())
  with check (tenant_id = app.current_tenant_id() and app.is_staff());
