# ULTRON — Supabase setup

The current feature branch adds Supabase email magic-link sign-in, per-user task/note cloud sync, and an authenticated AI Edge Function caller. These features are **not live** until the pull requests are reviewed and merged, the database migrations are applied, Auth redirect settings are configured, and the Edge Function is deployed.

## 1. Apply the database migrations

Use the Supabase SQL Editor in this order:

1. Open `supabase/migrations/20261114000000_initial_schema.sql`, copy the full SQL, and run it.
2. Open `supabase/migrations/20261115000000_ai_rate_limit.sql`, copy the full SQL, and run it.
3. Confirm that `tasks`, `notes`, `ultron_ai_usage`, and `ultron_user_roles` exist in Table Editor.

Do not run the initial schema twice using both `schema.sql` and the migration. They create the same tasks/notes foundation. The second migration adds the private AI quota table and function. The third migration adds server-managed owner roles.

3. Open `supabase/migrations/20261116000000_owner_roles.sql` and run it.\n\n## Assign the owner role\n\nAfter the owner has signed in once, find that account's user UUID in Supabase Authentication → Users. In the SQL Editor, run the commented `INSERT` example at the bottom of `20261116000000_owner_roles.sql`, replacing `AUTH_USER_UUID` with the verified UUID. Do not send the UUID or any secret to chat. The website never lets a browser user grant themselves owner access.\n\n## 2. Configure email sign-in

In Supabase Authentication settings:

1. Enable Email sign-in.
2. Set the Site URL to `https://ahmadzshan999-hub.github.io`.
3. Add `https://ahmadzshan999-hub.github.io/ULTRON/` to allowed redirect URLs.
4. Test the magic-link flow with an account you control.

The website asks Supabase to send a sign-in link; it does not collect or store a password.

## 3. Cloud data and privacy

- Tasks and notes are stored per signed-in user.
- Row Level Security policies restrict records to the authenticated user's `auth.uid()`.
- On sign-in, the cloud workspace loads. Before sending the sign-in link, the website preserves local browser data so the user can explicitly import it afterward.
- The import button merges local records into the cloud account; it does not delete unrelated cloud rows.
- Test with two separate test accounts before storing real information.

A publishable key is public-client configuration and may appear in browser code. RLS must remain enabled. **Never put a Secret/service-role key, database password, or provider key in HTML, JavaScript, GitHub, or chat.**

## 4. Configure and deploy the AI function

The Edge Function is named `ultron-chat`. In Supabase Function Secrets, the account owner must set:

- `OPENAI_API_KEY` — private provider API key.
- `OPENAI_MODEL` — a model identifier enabled for that provider account.

Then deploy the function using the current Supabase CLI or Dashboard instructions. Keep JWT verification enabled. Test a signed-in chat request and confirm that unauthenticated requests are rejected.

The AI endpoint enforces a fixed starter quota of 30 requests per user per rolling hour. This is not a full billing or abuse-prevention system; configure provider spending limits and monitoring too.

## 5. Not included yet

- Gmail, WhatsApp, and calendar integrations (each needs official OAuth/API setup and user permission).
- Gmail, WhatsApp Business and calendar connections (official provider setup and permissions required).\n- Payment checkout and subscription entitlements (adult account owner must configure and verify a provider).\n- Background wake-word listening; browser wake-word preview needs the page open and visible.
- Subscription checkout, payment webhooks, and subscription entitlements.
- Background wake-word listening; browser wake-word preview needs the page open and visible.

Provider billing and account setup should be handled by a parent/guardian where required. Do not share provider credentials in chat.
