-- KYC documents and checks. Documents are the captured evidence, checks are the
-- provider results (MNO, liveness, AML and PEP). Both scoped to an account.

create table if not exists public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  account_id uuid not null references public.accounts(id),
  type text not null check (type in ('nrc','passport','proof_of_residence')),
  storage_path text not null,
  extraction jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING'
    check (status in ('PENDING','EXTRACTED','VERIFIED','REJECTED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kyc_documents_account_idx on public.kyc_documents(account_id);

create trigger kyc_documents_touch_updated_at
  before update on public.kyc_documents
  for each row execute function app.touch_updated_at();

alter table public.kyc_documents enable row level security;

create policy kyc_documents_select on public.kyc_documents
  for select using (app.owns_account(account_id));

create policy kyc_documents_insert on public.kyc_documents
  for insert with check (
    tenant_id = app.current_tenant_id() and app.owns_account(account_id)
  );

create policy kyc_documents_update on public.kyc_documents
  for update using (tenant_id = app.current_tenant_id() and app.is_staff());

-- ---------------------------------------------------------------------------

create table if not exists public.kyc_checks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  account_id uuid not null references public.accounts(id),
  channel text not null check (channel in ('mno','liveness','aml_pep')),
  result text not null check (result in ('pass','refer','fail')),
  reason_codes text[] not null default '{}',
  raw_provider_ref text,
  created_at timestamptz not null default now()
);

create index if not exists kyc_checks_account_idx on public.kyc_checks(account_id);

alter table public.kyc_checks enable row level security;

create policy kyc_checks_select on public.kyc_checks
  for select using (app.owns_account(account_id));

create policy kyc_checks_insert on public.kyc_checks
  for insert with check (
    tenant_id = app.current_tenant_id() and app.is_staff()
  );
