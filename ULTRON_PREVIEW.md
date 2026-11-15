# ULTRON Command Centre — current feature preview

This branch combines the redesigned command centre with an opt-in browser voice layer, Supabase account/cloud scaffolding, and an authenticated AI backend caller.

## Included in this branch

- Responsive command-centre dashboard and navigation.
- Local task and notes tools, with a Supabase per-user cloud sync path after email magic-link sign-in and database setup.
- Explicit local-data import after sign-in.
- Built-in demo replies for signed-out visitors.
- Signed-in chat invokes the protected `ultron-chat` Edge Function when deployed and configured.
- Browser voice input and spoken replies where supported.
- Optional wake-word listening for “ULTRON” while the tab remains open and visible.
- Dark/light theme.

## Not live or not configured

- The Supabase migrations have not been applied to the user's project.
- Email Auth redirect settings have not been configured or tested.
- The AI Edge Function has not been deployed and provider secrets/model have not been configured.
- No end-to-end browser, auth, cloud sync, or AI test has passed yet.
- Gmail, WhatsApp, calendar, subscriptions/payments, and Owner Console are not connected or enabled.
- Wake-word listening is not available when the browser is closed or the tab is hidden.

## Security direction

Provider keys remain server-side in Supabase Function Secrets. The browser only uses a Supabase publishable key and authenticated user session. RLS isolates each user's tasks and notes; the AI endpoint requires authentication and enforces a starter per-user request quota. Never put Secret/service-role keys, database passwords, or provider keys in frontend files or GitHub.

External integrations should use official OAuth/API flows, least-privilege scopes, revocable access, and explicit confirmation before sending messages or emails. Owner privileges must be assigned and checked server-side; never protect an Owner Console with a password embedded in frontend JavaScript.

## Publishing

This feature branch does not change the live GitHub Pages website. The pull requests must be reviewed and merged in dependency order, followed by deployment and end-to-end testing. Google Search indexing is separate from publishing the website.
