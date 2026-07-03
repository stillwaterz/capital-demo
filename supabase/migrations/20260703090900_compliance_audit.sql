-- compliance_alerts and the global append-only audit_events stream.

create table if not exists public.compliance_alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  account_id uuid references public.accounts(id),
  type text not null check (type in ('THRESHOLD','VELOCITY','STRUCTURING','SANCTIONS','PEP')),
  severity text not null check (severity in ('LOW','MEDIUM','HIGH','CRITICAL')),
  reason_codes text[] not null default '{}',
  description text not null,
  amount_ngwee bigint,
  status text not null default 'OPEN'
    check (status in ('OPEN','REVIEWING','CLEARED','ESCALATED')),
  mlro_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists compliance_alerts_status_idx
  on public.compliance_alerts(tenant_id, status);

create trigger compliance_alerts_touch_updated_at
  before update on public.compliance_alerts
  for each row execute function app.touch_updated_at();

alter table public.compliance_alerts enable row level security;

-- Surveillance is a back-office concern. Staff only, never client visible.
create policy compliance_alerts_all on public.compliance_alerts
  for all using (tenant_id = app.current_tenant_id() and app.is_staff())
  with check (tenant_id = app.current_tenant_id() and app.is_staff());

-- ---------------------------------------------------------------------------

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  action text not null,
  actor text not null,
  actor_role text,
  target_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_tenant_idx on public.audit_events(tenant_id, created_at);

alter table public.audit_events enable row level security;

-- Immutable inspector stream.
create trigger audit_events_no_update
  before update on public.audit_events
  for each row execute function app.block_mutations();
create trigger audit_events_no_delete
  before delete on public.audit_events
  for each row execute function app.block_mutations();

create policy audit_events_select on public.audit_events
  for select using (tenant_id = app.current_tenant_id() and app.is_staff());
create policy audit_events_insert on public.audit_events
  for insert with check (tenant_id = app.current_tenant_id() and app.is_staff());
