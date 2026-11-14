# ULTRON — Supabase setup

This repository currently contains a static GitHub Pages preview. Its tasks and notes are stored in the browser. This migration prepares a secure per-account database, but **does not connect the website to it yet**.

## 1. Create the tables

1. Open your ULTRON project in Supabase.
2. Open **SQL Editor**.
3. Choose **New query**.
4. Open `supabase/schema.sql` in this repository and copy its full contents.
5. Paste the SQL into the editor and click **Run**.
6. Confirm that `tasks` and `notes` appear under **Table Editor**.

The script enables Row Level Security (RLS), grants access only to authenticated users, and adds policies that restrict each user to rows whose `user_id` matches their signed-in account.

## 2. Keys and project URL

The browser app may use the **Project URL** and **Publishable key**. A publishable key is intended for public client applications; it is not a replacement for RLS.

**Never put a Secret key or service-role key in HTML, JavaScript, GitHub, or any browser code.** Those keys bypass normal RLS protections and must stay on a trusted server.

## 3. What is not enabled yet

- The current website still uses browser-local storage for tasks and notes.
- Supabase sign-in and cloud syncing are a separate next step.
- Subscription prices shown in the website are proposals only; there is no checkout or billing.
- The Owner Console remains locked. Do not add an owner password check to frontend JavaScript. Owner permissions need trusted server-side authorization.

## 4. Data safety

Run the SQL only in the ULTRON Supabase project. Do not paste database passwords or Secret keys into chat or GitHub. Test with a non-sensitive account and sample tasks before storing anything important.
