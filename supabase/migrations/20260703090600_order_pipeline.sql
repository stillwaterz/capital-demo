-- Order pipeline: instruments catalogue, orders, append-only order_events,
-- operator order_blocks and executions.

create table if not exists public.instruments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  symbol text not null,
  name text not null,
  board_lot integer not null default 100 check (board_lot > 0),
  last_price_ngwee bigint not null check (last_price_ngwee >= 0),
  tick_size_ngwee bigint not null default 1 check (tick_size_ngwee > 0),
  status text not null default 'active' check (status in ('active','suspended','delisted')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (tenant_id, symbol)
);

create trigger instruments_touch_updated_at
  before update on public.instruments
  for each row execute function app.touch_updated_at();

alter table public.instruments enable row level security;

-- Any authenticated user in the tenant can read the catalogue. Staff maintain it.
create policy instruments_select on public.instruments
  for select using (tenant_id = app.current_tenant_id());
create policy instruments_write on public.instruments
  for all using (tenant_id = app.current_tenant_id() and app.is_staff())
  with check (tenant_id = app.current_tenant_id() and app.is_staff());

-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  account_id uuid not null references public.accounts(id),
  instrument_id uuid not null references public.instruments(id),
  side text not null check (side in ('buy','sell')),
  input_mode text not null check (input_mode in ('quantity','value')),
  requested_qty integer check (requested_qty > 0),
  requested_value_ngwee bigint check (requested_value_ngwee > 0),
  resolved_qty integer check (resolved_qty >= 0),
  order_type text not null check (order_type in ('market','limit')),
  limit_price_ngwee bigint check (limit_price_ngwee > 0),
  status text not null default 'draft' check (status in (
    'draft','confirmed','cooling_off','queued','staged','working',
    'partially_filled','filled','cancelled','rejected','expired'
  )),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, idempotency_key),
  -- Exactly one input is provided, matching input_mode.
  check (
    (input_mode = 'quantity' and requested_qty is not null and requested_value_ngwee is null)
    or (input_mode = 'value' and requested_value_ngwee is not null and requested_qty is null)
  )
);

create index if not exists orders_account_idx on public.orders(account_id, created_at);
create index if not exists orders_status_idx on public.orders(tenant_id, status);

create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function app.touch_updated_at();

alter table public.orders enable row level security;

create policy orders_select on public.orders
  for select using (app.owns_account(account_id));
create policy orders_insert on public.orders
  for insert with check (
    tenant_id = app.current_tenant_id() and app.owns_account(account_id)
  );
-- Clients may cancel their own unfilled orders; staff drive every other change.
create policy orders_update on public.orders
  for update using (
    tenant_id = app.current_tenant_id()
    and (app.is_staff() or app.owns_account(account_id))
  );

-- ---------------------------------------------------------------------------

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  order_id uuid not null references public.orders(id),
  from_status text,
  to_status text not null,
  reason text,
  actor text not null,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events(order_id, created_at);

alter table public.order_events enable row level security;

create trigger order_events_no_update
  before update on public.order_events
  for each row execute function app.block_mutations();
create trigger order_events_no_delete
  before delete on public.order_events
  for each row execute function app.block_mutations();

create policy order_events_select on public.order_events
  for select using (
    tenant_id = app.current_tenant_id()
    and exists (
      select 1 from public.orders o
      where o.id = order_events.order_id and app.owns_account(o.account_id)
    )
  );
create policy order_events_insert on public.order_events
  for insert with check (
    tenant_id = app.current_tenant_id() and app.is_staff()
  );

-- ---------------------------------------------------------------------------

create table if not exists public.order_blocks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  instrument_id uuid not null references public.instruments(id),
  side text not null check (side in ('buy','sell')),
  aggregate_qty integer not null default 0 check (aggregate_qty >= 0),
  avg_fill_price_ngwee bigint check (avg_fill_price_ngwee >= 0),
  status text not null default 'open'
    check (status in ('open','staged','working','filled','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger order_blocks_touch_updated_at
  before update on public.order_blocks
  for each row execute function app.touch_updated_at();

alter table public.order_blocks enable row level security;

-- Operator aggregation. Staff only, no client visibility.
create policy order_blocks_all on public.order_blocks
  for all using (tenant_id = app.current_tenant_id() and app.is_staff())
  with check (tenant_id = app.current_tenant_id() and app.is_staff());

-- ---------------------------------------------------------------------------

create table if not exists public.executions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  order_id uuid not null references public.orders(id),
  block_id uuid references public.order_blocks(id),
  fill_qty integer not null check (fill_qty > 0),
  fill_price_ngwee bigint not null check (fill_price_ngwee >= 0),
  ats_ref text,
  created_at timestamptz not null default now()
);

create index if not exists executions_order_idx on public.executions(order_id);

alter table public.executions enable row level security;

create policy executions_select on public.executions
  for select using (
    tenant_id = app.current_tenant_id()
    and exists (
      select 1 from public.orders o
      where o.id = executions.order_id and app.owns_account(o.account_id)
    )
  );
create policy executions_insert on public.executions
  for insert with check (
    tenant_id = app.current_tenant_id() and app.is_staff()
  );
