-- Server-managed ULTRON owner roles. No browser client can grant or change roles.
create table if not exists public.ultron_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner')),
  created_at timestamptz not null default now()
);

alter table public.ultron_user_roles enable row level security;
revoke all on public.ultron_user_roles from anon, authenticated;
grant select on public.ultron_user_roles to authenticated;

drop policy if exists "Users can view their own ULTRON role" on public.ultron_user_roles;
create policy "Users can view their own ULTRON role"
  on public.ultron_user_roles for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- No INSERT, UPDATE, or DELETE policy is intentionally provided.
-- Assign the first owner manually in the Supabase SQL Editor after verifying the account:
-- insert into public.ultron_user_roles (user_id, role)
-- values ('AUTH_USER_UUID', 'owner')
-- on conflict (user_id) do update set role = excluded.role;
