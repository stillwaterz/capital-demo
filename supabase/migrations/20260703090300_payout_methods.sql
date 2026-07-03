-- verified_payout_methods: accounts a client may withdraw to, in their own name.
-- Withdrawals are restricted to a verified method here (enforced in app + policy).

create table if not exists public.verified_payout_methods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  account_id uuid not null references public.accounts(id),
  channel text not null check (channel in ('momo','bank')),
  account_ref text not null,
  account_name text not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payout_methods_account_idx
  on public.verified_payout_methods(account_id);

create trigger payout_methods_touch_updated_at
  before update on public.verified_payout_methods
  for each row execute function app.touch_updated_at();

alter table public.verified_payout_methods enable row level security;

create policy payout_methods_select on public.verified_payout_methods
  for select using (app.owns_account(account_id));

create policy payout_methods_insert on public.verified_payout_methods
  for insert with check (
    tenant_id = app.current_tenant_id() and app.owns_account(account_id)
  );

-- Only staff mark a method verified, after the name-match check passes.
create policy payout_methods_update on public.verified_payout_methods
  for update using (tenant_id = app.current_tenant_id() and app.is_staff());
