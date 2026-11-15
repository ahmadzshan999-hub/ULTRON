-- Tier-aware AI usage limits for complimentary plan entitlements.
-- Free: 30 requests/hour. Plus: 100 requests/hour. Pro: 300 requests/hour.
create or replace function public.consume_ultron_ai_quota()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan text := 'free';
  v_limit integer := 30;
  v_window_seconds constant integer := 3600;
  v_allowed boolean;
begin
  if v_user_id is null then return false; end if;

  select e.plan into v_plan
  from public.ultron_entitlements as e
  where e.user_id = v_user_id
    and e.status = 'active'
    and (e.expires_at is null or e.expires_at > now())
  limit 1;

  v_limit := case v_plan
    when 'plus' then 100
    when 'pro' then 300
    else 30
  end;

  insert into public.ultron_ai_usage as current_usage (user_id, window_started_at, request_count)
  values (v_user_id, now(), 1)
  on conflict (user_id) do update
  set
    window_started_at = case
      when current_usage.window_started_at <= now() - make_interval(secs => v_window_seconds) then now()
      else current_usage.window_started_at
    end,
    request_count = case
      when current_usage.window_started_at <= now() - make_interval(secs => v_window_seconds) then 1
      else current_usage.request_count + 1
    end
  returning request_count <= v_limit into v_allowed;

  return coalesce(v_allowed, false);
end;
$$;

revoke all on function public.consume_ultron_ai_quota() from public, anon;
grant execute on function public.consume_ultron_ai_quota() to authenticated;
