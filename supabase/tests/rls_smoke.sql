-- RLS smoke test. Run against a database with all migrations applied.
--   psql "$DATABASE_URL" -f supabase/tests/rls_smoke.sql
--
-- Proves: cross-tenant isolation both ways, append-only immutability on the
-- ledger, and fail-closed behaviour when unauthenticated. Every assertion below
-- raises if the policy is wrong, so a clean run means the policies hold.

begin;

insert into auth.users(id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');
insert into public.tenants(id, slug, name) values
  ('aaaaaaaa-0000-0000-0000-000000000001','t1','Tenant One'),
  ('bbbbbbbb-0000-0000-0000-000000000002','t2','Tenant Two');
insert into public.accounts(id, tenant_id, auth_user_id, full_name) values
  ('a1111111-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Client One'),
  ('a2222222-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','Client Two');
insert into public.ledger_entries(tenant_id, account_id, type, amount_ngwee, idempotency_key) values
  ('aaaaaaaa-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000001','deposit',100000,'seed-1');

grant usage on schema public, app, auth to authenticated;
grant select, insert, update on all tables in schema public to authenticated;

-- Client one sees only its own account.
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","app_metadata":{"tenant_id":"aaaaaaaa-0000-0000-0000-000000000001"}}', true);
do $$ begin
  assert (select count(*) from public.accounts) = 1, 'client1 should see exactly one account';
  assert (select count(*) from public.accounts
          where id = 'a2222222-0000-0000-0000-000000000002') = 0, 'client1 must not see client2';
end $$;

-- Client two is isolated and cannot see client one's ledger.
select set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","app_metadata":{"tenant_id":"bbbbbbbb-0000-0000-0000-000000000002"}}', true);
do $$ begin
  assert (select count(*) from public.accounts) = 1, 'client2 should see exactly one account';
  assert (select count(*) from public.ledger_entries) = 0, 'client2 must not see client1 ledger';
end $$;

-- Unauthenticated (no claims) sees nothing.
select set_config('request.jwt.claims', '', true);
do $$ begin
  assert (select count(*) from public.accounts) = 0, 'anon must see no accounts';
end $$;

reset role;

-- Append-only: the ledger cannot be mutated.
do $$ begin
  begin
    update public.ledger_entries set amount_ngwee = 1 where idempotency_key = 'seed-1';
    assert false, 'ledger update should have been blocked';
  exception when others then
    assert sqlerrm like '%append-only%', 'expected append-only error, got: ' || sqlerrm;
  end;
end $$;

rollback;
