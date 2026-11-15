-- Per-user AI request quota. The table is not directly accessible to browser users.
create table if not exists public.ultron_ai_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);

alter table public.ultron_ai_usage enable row level security;
revoke all on public.ultron_ai_usage from anon, authenticated;

create or replace function public.consume_ultron_ai_quota()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit constant integer := 30;
  v_window_seconds constant integer := 3600;
  v_allowed boolean;
begin
  if v_user_id is null then
    return false;
  end if;

  insert into public.ultron_ai_usage as current_usage (
    user_id, window_started_at, request_count
  )
  values (v_user_id, now(), 1)
  on conflict (user_id) do update
  set
    window_started_at = case
      when current_usage.window_started_at <= now() - make_interval(secs => v_window_seconds)
      then now()
      else current_usage.window_started_at
    end,
    request_count = case
      when current_usage.window_started_at <= now() - make_interval(secs => v_window_seconds)
      then 1
      else current_usage.request_count + 1
    end
  returning request_count <= v_limit into v_allowed;

  return coalesce(v_allowed, false);
end;
$$;

revoke all on function public.consume_ultron_ai_quota() from public, anon;
grant execute on function public.consume_ultron_ai_quota() to authenticated;
