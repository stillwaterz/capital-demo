-- accounts: one per client. Links the auth user, KYC status, tier and CSD ref.
-- Also the anchor for account-ownership RLS on every downstream client table.

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  auth_user_id uuid not null references auth.users(id),
  full_name text not null,
  kyc_status text not null default 'PENDING'
    check (kyc_status in ('PENDING','IN_REVIEW','APPROVED','REJECTED','REFRESH_DUE')),
  tier text not null default 'TIER_0'
    check (tier in ('TIER_0','TIER_1','TIER_2')),
  csd_account_ref text,
  suitability_profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, auth_user_id)
);

create index if not exists accounts_tenant_idx on public.accounts(tenant_id);
create index if not exists accounts_auth_user_idx on public.accounts(auth_user_id);

create trigger accounts_touch_updated_at
  before update on public.accounts
  for each row execute function app.touch_updated_at();

alter table public.accounts enable row level security;

-- A client sees only their own account within their tenant. Staff see the tenant.
create policy accounts_select on public.accounts
  for select using (
    tenant_id = app.current_tenant_id()
    and (auth_user_id = auth.uid() or app.is_staff())
  );

create policy accounts_insert on public.accounts
  for insert with check (
    tenant_id = app.current_tenant_id()
    and auth_user_id = auth.uid()
  );

create policy accounts_update on public.accounts
  for update using (
    tenant_id = app.current_tenant_id() and app.is_staff()
  );

-- Ownership helper used by every client-scoped table below.
create or replace function app.owns_account(target_account_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.accounts a
    where a.id = target_account_id
      and a.tenant_id = app.current_tenant_id()
      and (a.auth_user_id = auth.uid() or app.is_staff())
  );
$$;
