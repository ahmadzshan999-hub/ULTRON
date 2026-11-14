# ULTRON — Supabase setup

This repository currently contains a static GitHub Pages preview. Tasks and notes are still stored in the browser. The SQL in this branch prepares a per-account database; it does **not** connect the website, enable sign-in, or sync existing browser data.

## Choose one way to apply the database SQL

### Option A — Supabase Dashboard (simplest)

1. Open the ULTRON project in Supabase.
2. Open **SQL Editor** and choose **New query**.
3. Open `supabase/schema.sql` in this repository and copy its full contents.
4. Paste the SQL into the editor and click **Run**.
5. Confirm that `tasks` and `notes` appear under **Table Editor**.

### Option B — Supabase CLI migrations

The versioned migration is in `supabase/migrations/20261114000000_initial_schema.sql`. If you use the Supabase CLI, follow Supabase's current CLI instructions to link your local project and apply pending migrations. Do not apply both Option A and Option B as separate setup steps; they contain the same initial schema.

## What the database protections do

- Row Level Security (RLS) is enabled on both tables.
- Only authenticated users receive table CRUD grants.
- Each policy checks that the row's `user_id` matches the signed-in user's `auth.uid()`.
- Foreign keys remove a user's rows if their auth account is deleted.
- The `updated_at` timestamp is refreshed automatically when a task or note is edited.

These protections are important, but they do not replace testing. Before storing real information, test with two separate test accounts and confirm each account can only read and change its own rows.

## Project URL and keys

A browser app may use the Supabase **Project URL** and **Publishable key**. A publishable key is designed for public client applications; it is not a secret and does not replace RLS.

**Never put a Secret key or service-role key in HTML, JavaScript, GitHub, or any browser code.** Those keys must stay on a trusted server because they can bypass normal RLS protections. Never put your database password in the repository or in chat.

## Not enabled yet

- The current website still uses browser-local storage for tasks and notes.
- Supabase sign-in and cloud syncing have not been connected.
- Existing browser-saved tasks and notes are not automatically copied into Supabase.
- Subscription prices shown in the website are proposals only; checkout and billing are not enabled.
- The Owner Console is not protected by a real owner authorization system. Do not add an owner password check to frontend JavaScript; owner permissions need trusted server-side authorization.

## Before going live

1. Apply the schema to a test Supabase project first.
2. Test account isolation with two separate test users.
3. Confirm sign-up, sign-in, sign-out, password recovery, and account deletion behavior before adding those features to the site.
4. Plan a safe export/backup and migration path before moving from browser storage to cloud storage.
5. Keep billing disabled until a trusted backend verifies payments and subscription status.
