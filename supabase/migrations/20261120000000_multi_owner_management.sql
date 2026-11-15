-- Allow multiple trusted owners and manage role changes atomically.
alter table public.ultron_owner_audit
  drop constraint if exists ultron_owner_audit_action_check;

alter table public.ultron_owner_audit
  add constraint ultron_owner_audit_action_check
  check (action in ('grant', 'revoke', 'owner_added', 'owner_removed'));

create or replace function public.ultron_manage_owner(
  p_target_user_id uuid,
  p_actor_user_id uuid,
  p_action text,
  p_target_email_hint text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_count integer;
  v_rows integer;
begin
  if p_action not in ('add', 'remove') then
    raise exception 'Unsupported owner action';
  end if;

  -- Serialize role changes so two simultaneous removals cannot delete the final owner.
  perform pg_advisory_xact_lock(726401921::bigint);

  if p_action = 'add' then
    insert into public.ultron_user_roles (user_id, role)
    values (p_target_user_id, 'owner')
    on conflict (user_id) do nothing;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      return 'already_owner';
    end if;

    insert into public.ultron_owner_audit (actor_id, action, plan, target_email_hint)
    values (p_actor_user_id, 'owner_added', 'free', p_target_email_hint);
    return 'added';
  end if;

  select count(*) into v_owner_count from public.ultron_user_roles where role = 'owner';
  if not exists (
    select 1 from public.ultron_user_roles
    where user_id = p_target_user_id and role = 'owner'
  ) then
    return 'not_owner';
  end if;
  if v_owner_count <= 1 then
    return 'last_owner';
  end if;

  delete from public.ultron_user_roles where user_id = p_target_user_id and role = 'owner';
  insert into public.ultron_owner_audit (actor_id, action, plan, target_email_hint)
  values (p_actor_user_id, 'owner_removed', 'free', p_target_email_hint);
  return 'removed';
end;
$$;

revoke all on function public.ultron_manage_owner(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.ultron_manage_owner(uuid, uuid, text, text) to service_role;
