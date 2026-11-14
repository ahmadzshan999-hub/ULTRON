# ULTRON AI backend setup

The repository now contains a **backend scaffold**, not a deployed AI service. It keeps the provider key on the server and requires a signed-in Supabase user before accepting chat requests.

## What the Edge Function does

- Accepts authenticated POST requests only; Supabase JWT verification remains enabled.
- Re-checks the caller's Supabase Auth session.
- Validates and limits message/history size.
- Calls the OpenAI Responses API from the server.
- Reads the model from server configuration and the provider key from a Supabase Function Secret.
- Returns only the assistant reply; it does not expose provider credentials or raw provider errors.

## Required setup (not performed by this code change)

1. Review and merge the database/auth foundation before using real accounts.
2. In Supabase, create or configure Supabase Auth sign-in for ULTRON and test user isolation.
3. Set the Edge Function secrets in the Supabase Dashboard:
   - `OPENAI_API_KEY`: the provider API key (keep it private; never commit it or paste it into chat).
   - `OPENAI_MODEL`: a model identifier enabled for the provider account.
4. Deploy the function named `ultron-chat` using the Supabase CLI or Dashboard.
5. Configure the deployed function's allowed website origin if ULTRON is moved to a custom domain.
6. Connect the website's sign-in flow and invoke this function with the user's Supabase session.
7. Add server-side usage limits, monitoring, and cost controls before inviting other users.

Supabase Edge Functions support server-side third-party API calls and project secrets. Keep JWT verification enabled for user-facing functions. See the official [Edge Functions guide](https://supabase.com/docs/guides/functions), [function authentication guide](https://supabase.com/docs/guides/functions/auth), and [secrets guide](https://supabase.com/docs/guides/functions/secrets).

The function uses the OpenAI Responses API. New integrations should use Responses rather than the retired Assistants API. See the official [Assistants migration guide](https://platform.openai.com/docs/assistants/migration).

## Not yet connected

The current feature branch includes a Supabase email magic-link sign-in UI and invokes this function for signed-in conversations. The function has not been deployed or tested against the user's Supabase project, and no provider secret/model has been configured. Until those steps are complete, signed-out visitors see local demo replies and signed-in requests may receive a backend-not-ready message. Do not describe ULTRON as live AI until secrets, deployment, and end-to-end tests are complete.

## Account sign-in and cloud workspace

The website now includes email magic-link sign-in using Supabase Auth. Before using it:

1. In Supabase Authentication settings, enable Email sign-in.
2. Set the Site URL to `https://ahmadzshan999-hub.github.io`.
3. Add `https://ahmadzshan999-hub.github.io/ULTRON/` to the allowed redirect URLs.
4. Apply both database migrations in order:
   - `20261114000000_initial_schema.sql`
   - `20261115000000_ai_rate_limit.sql`
5. Test sign-in, sign-out, RLS isolation with two test accounts, cloud task/note CRUD, and the local-data import flow.

The browser uses only the Supabase Project URL and publishable key. The key is public-client configuration, not a secret; RLS must remain enabled. Never add a Secret/service-role key to the frontend.

## AI usage limit

The AI Edge Function calls `consume_ultron_ai_quota` before contacting the provider. The migration enforces a fixed limit of 30 requests per user per rolling hour. The limit is fixed in the SQL function so browser callers cannot weaken it by passing custom parameters. This is a starter safeguard, not a complete billing or abuse-prevention system. Add monitoring and adjust limits only after testing.

## Still requires owner setup

The account owner must configure the provider API key and model name in Supabase Function Secrets, deploy the Edge Function, and verify a signed-in end-to-end chat request. Provider billing and account setup should be handled by a parent/guardian where required. Do not paste provider keys into chat or commit them to GitHub.
