-- Auth provisioning.
--
-- On signup, create the client's account under a default tenant and stamp
-- tenant_id into app_metadata so it travels in the JWT and RLS can read it.
-- The trigger runs as definer, so it inserts the account past RLS on the user's
-- behalf. Staff roles are granted out of band, not here.

-- A default tenant for self-service signups. Production may route to others.
insert into public.tenants (id, slug, name)
values ('00000000-0000-0000-0000-000000000001', 'default', 'Default Tenant')
on conflict (id) do nothing;

create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_tenant uuid := '00000000-0000-0000-0000-000000000001';
begin
  insert into public.accounts (tenant_id, auth_user_id, full_name)
  values (
    default_tenant,
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New client')
  );

  update auth.users
  set raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('tenant_id', default_tenant::text)
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();
