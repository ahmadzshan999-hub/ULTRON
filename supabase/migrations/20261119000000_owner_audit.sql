-- Private audit trail for owner-initiated complimentary plan changes.
create table if not exists public.ultron_owner_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('grant', 'revoke')),
  plan text not null check (plan in ('free', 'plus', 'pro')),
  target_email_hint text not null,
  duration text,
  created_at timestamptz not null default now()
);

create index if not exists ultron_owner_audit_created_at_idx
  on public.ultron_owner_audit (created_at desc);

alter table public.ultron_owner_audit enable row level security;
revoke all on public.ultron_owner_audit from anon, authenticated;
-- The server-side Owner Console reads and writes this table with its service-role client only.
