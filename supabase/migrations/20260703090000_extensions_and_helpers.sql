-- Foundation: extensions, tenants, and the helpers every RLS policy leans on.
--
-- Multi-tenant from day one. Tenant and staff role travel in the JWT app_metadata
-- claim, set at signup. Client rows are owned by an auth user through accounts.
-- Money is integer ngwee stored as bigint. All timestamps are timestamptz in UTC.

create extension if not exists pgcrypto;

create schema if not exists app;

-- ---------------------------------------------------------------------------
-- Tenants
-- ---------------------------------------------------------------------------

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.tenants enable row level security;

-- ---------------------------------------------------------------------------
-- Claim helpers
-- ---------------------------------------------------------------------------

-- Parsed JWT claims, or an empty object when unauthenticated. Fails closed by
-- guarding the empty string before the jsonb cast rather than raising.
create or replace function app.jwt_claims()
returns jsonb
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$;

-- Tenant id from the JWT app_metadata claim. Null when unauthenticated.
create or replace function app.current_tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(
      app.jwt_claims() -> 'app_metadata' ->> 'tenant_id',
      app.jwt_claims() ->> 'tenant_id'
    ),
    ''
  )::uuid;
$$;

-- Staff role from the JWT app_metadata claim, for the back office. Null for clients.
create or replace function app.current_staff_role()
returns text
language sql
stable
as $$
  select nullif(
    coalesce(
      app.jwt_claims() -> 'app_metadata' ->> 'staff_role',
      app.jwt_claims() ->> 'staff_role'
    ),
    ''
  );
$$;

-- True when the caller is back-office staff in the current tenant.
create or replace function app.is_staff()
returns boolean
language sql
stable
as $$
  select app.current_staff_role() is not null;
$$;

-- ---------------------------------------------------------------------------
-- Shared triggers
-- ---------------------------------------------------------------------------

-- Keep updated_at fresh on projection tables.
create or replace function app.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Block updates and deletes on append-only, event-sourced tables. The ledger and
-- the event streams are immutable; corrections are new rows, never edits.
create or replace function app.block_mutations()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Table %.% is append-only', tg_table_schema, tg_table_name;
end;
$$;
