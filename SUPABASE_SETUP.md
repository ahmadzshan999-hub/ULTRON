# ULTRON — Supabase setup

These instructions are for the account owner. The repository contains the code, but these steps are required before the website can use cloud accounts, live AI, or the Owner Console.

## 1. Apply the database migrations

In the Supabase SQL Editor, run these files in this order:

1. `supabase/migrations/20261114000000_initial_schema.sql` — private tasks and notes tables with Row Level Security.
2. `supabase/migrations/20261115000000_ai_rate_limit.sql` — per-user AI request quota.
3. `supabase/migrations/20261116000000_owner_roles.sql` — server-managed owner roles.
4. `supabase/migrations/20261117000000_complimentary_entitlements.sql` — private complimentary plan entitlements.
5. `supabase/migrations/20261118000000_tier_ai_limits.sql` — enforce AI request limits for each plan.
6. `supabase/migrations/20261119000000_owner_audit.sql` — private audit log for owner plan changes.
7. `supabase/migrations/20261120000000_multi_owner_management.sql` — atomic multi-owner management and audit events.

Do not run both `schema.sql` and the first migration; they create the same tasks/notes foundation. Confirm that `tasks`, `notes`, `ultron_ai_usage`, and `ultron_user_roles`, and `ultron_entitlements` exist.

## 2. Configure email sign-in

In Supabase Authentication settings:

1. Enable Email sign-in.
2. Set the Site URL to `https://ahmadzshan999-hub.github.io`.
3. Add `https://ahmadzshan999-hub.github.io/ULTRON/` to allowed redirect URLs.
4. Test the magic-link flow with an account you control.

The website sends a sign-in link. It does not collect or store a Supabase password.

## 3. Cloud data and privacy

- Tasks and notes are stored per signed-in user.
- RLS policies restrict records to the authenticated user's `auth.uid()`.
- Before sign-in, the website saves a local backup. After sign-in, use the explicit import button to merge that backup into the cloud account.
- Test with two separate accounts to confirm that neither can read or change the other's records.

A publishable key is public-client configuration. RLS must remain enabled. Never put a Secret/service-role key, database password, or provider key in HTML, JavaScript, GitHub, or chat.

## 4. Configure and deploy live AI

In Supabase Function Secrets, set:

- `GEMINI_API_KEY` — private Google AI Studio key (recommended low-cost starting point).
- `GEMINI_MODEL` — `gemini-3.6-flash` (or a model available to your account).
- `AI_PROVIDER` — `gemini`.
- `SUPABASE_PUBLISHABLE_KEYS` — JSON containing the project's publishable key under the `default` property, as expected by the AI function.

Alternatively, configure `OPENAI_API_KEY`, `OPENAI_MODEL`, and set `AI_PROVIDER=openai`. The free Gemini tier has rate limits and its terms allow submitted content to be used to improve Google's products; do not send sensitive information through it.

Deploy `supabase/functions/ultron-chat` with JWT verification enabled. The function enforces a fixed starter limit of 30 requests per user per rolling hour. Also configure provider spending limits and monitoring.

## 5. Activate the Owner Console

The Owner Console is hidden until the server verifies the signed-in account's owner role. It includes aggregate metrics, configuration diagnostics, complimentary plan controls, multi-owner management, and a private audit log; it does not expose private task or note content.

1. After the intended owner signs in once, open Supabase Authentication → Users and copy that account's user UUID locally.
2. In the Supabase SQL Editor, run the following statement, replacing the placeholder with the verified UUID:

```sql
insert into public.ultron_user_roles (user_id, role)
values ('AUTH_USER_UUID', 'owner')
on conflict (user_id) do update set role = excluded.role;
```

3. In Supabase Function Secrets, set `SUPABASE_PUBLISHABLE_KEY` to the project's publishable key and `SUPABASE_SERVICE_ROLE_KEY` to the private service-role key.
4. Deploy `supabase/functions/ultron-admin` with JWT verification enabled.
5. Sign in as the owner and open Owner Console. Confirm that a non-owner account receives no access.

The service-role key is used only inside the server function after the user's owner role is verified. Never put it in frontend files, GitHub, or chat. Do not share the UUID or secret with ChatGPT.


## 6. Complimentary Plus and Pro grants

The Owner Console can grant Plus or Pro at no charge to an existing ULTRON account. The recipient must sign up and verify their email first. Enter that exact email in Owner Console, choose a plan and choose 30 days, 90 days, one year, or no expiry. The owner can revoke the grant by email. No payment is taken. Apply migration 20261117000000_complimentary_entitlements.sql and redeploy ultron-admin before using these controls. Entitlements are recorded securely, but Plus/Pro feature limits still need to be enforced in product services before those tiers are treated as fully active.

## 7. Owner Mission Control

The Owner Console's system diagnostics check whether the core tables exist and whether the AI provider secret and model configuration are present. A configured status is not a guarantee that the external AI provider is currently reachable. The activity log records complimentary plan grants and revocations with a masked email hint, action, plan, duration, and timestamp. The audit table is private and is accessed only by the owner-verified server function.

## 8. Integrations and subscriptions

- Gmail and Google Calendar need a Google Cloud project, OAuth consent configuration, redirect URLs, and protected server-side credentials.
- WhatsApp requires the official WhatsApp Business Platform / Cloud API and an eligible business account; it does not provide a general personal WhatsApp inbox connection.
- Subscription checkout remains disabled until an adult account owner selects and verifies a payment provider. Payment webhooks and entitlements must be checked server-side.

No external account is connected and no payment is being collected by this preview. Do not enter card details or external account passwords into ULTRON chat.

## 9. Voice limitations

Open the Voice Room from the sidebar for the dedicated microphone interface. Browser speech recognition and spoken replies require a supported browser, microphone permission, and the ULTRON tab open and visible. A web page cannot listen for a wake word after the browser is closed. A native app or supported operating-system integration would be needed for that.


## 10. Multiple trusted owners

After applying migration `20261120000000_multi_owner_management.sql` and redeploying `ultron-admin`, any verified owner can open Owner Console → Owner Management. Enter the exact email of an existing ULTRON account whose email has been verified, then choose Add owner. Existing owners appear in the directory and can have access removed. All owner changes are checked on the server and recorded in the private audit log. The database function serializes owner changes and prevents removal of the final remaining owner. Only grant owner access to people you fully trust: every owner can add or remove other owners and manage complimentary plans.
