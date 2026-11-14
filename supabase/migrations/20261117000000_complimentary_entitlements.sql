-- Complimentary ULTRON plan grants. No payment information is stored here.
create table if not exists public.ultron_entitlements (
 user_id uuid primary key references auth.users(id) on delete cascade,
 plan text not null default 'free' check (plan in ('free','plus','pro')),
 status text not null default 'active' check (status in ('active','revoked')),
 starts_at timestamptz not null default now(), expires_at timestamptz,
 granted_by uuid references auth.users(id) on delete set null,
 updated_at timestamptz not null default now()
);
alter table public.ultron_entitlements enable row level security;
revoke all on public.ultron_entitlements from anon, authenticated;
grant select on public.ultron_entitlements to authenticated;
drop policy if exists "Users can read their own ULTRON entitlement" on public.ultron_entitlements;
create policy "Users can read their own ULTRON entitlement" on public.ultron_entitlements for select to authenticated using ((select auth.uid()) = user_id);
-- No browser INSERT, UPDATE, or DELETE policy. Grants go through the owner-verified Edge Function.
