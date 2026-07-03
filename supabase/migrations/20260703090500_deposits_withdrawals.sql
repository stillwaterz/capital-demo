-- Deposits and withdrawals. Provider ref and status track the rail movement.
-- Withdrawals must point at a verified payout method in the client's own name.

create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  account_id uuid not null references public.accounts(id),
  channel text not null check (channel in ('momo','bank')),
  amount_ngwee bigint not null check (amount_ngwee > 0),
  provider_ref text,
  status text not null default 'pending'
    check (status in ('pending','settled','failed')),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, idempotency_key)
);

create index if not exists deposits_account_idx on public.deposits(account_id);

create trigger deposits_touch_updated_at
  before update on public.deposits
  for each row execute function app.touch_updated_at();

alter table public.deposits enable row level security;

create policy deposits_select on public.deposits
  for select using (app.owns_account(account_id));

create policy deposits_insert on public.deposits
  for insert with check (
    tenant_id = app.current_tenant_id() and app.owns_account(account_id)
  );

create policy deposits_update on public.deposits
  for update using (tenant_id = app.current_tenant_id() and app.is_staff());

-- ---------------------------------------------------------------------------

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  account_id uuid not null references public.accounts(id),
  payout_method_id uuid not null references public.verified_payout_methods(id),
  amount_ngwee bigint not null check (amount_ngwee > 0),
  provider_ref text,
  status text not null default 'pending'
    check (status in ('pending','settled','failed')),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, idempotency_key)
);

create index if not exists withdrawals_account_idx on public.withdrawals(account_id);

create trigger withdrawals_touch_updated_at
  before update on public.withdrawals
  for each row execute function app.touch_updated_at();

alter table public.withdrawals enable row level security;

create policy withdrawals_select on public.withdrawals
  for select using (app.owns_account(account_id));

-- A client may request a withdrawal only to their own verified payout method.
create policy withdrawals_insert on public.withdrawals
  for insert with check (
    tenant_id = app.current_tenant_id()
    and app.owns_account(account_id)
    and exists (
      select 1 from public.verified_payout_methods m
      where m.id = payout_method_id
        and m.account_id = withdrawals.account_id
        and m.verified_at is not null
    )
  );

create policy withdrawals_update on public.withdrawals
  for update using (tenant_id = app.current_tenant_id() and app.is_staff());
