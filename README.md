# ULTRON — Personal AI Workspace

ULTRON is a responsive personal workspace with a dashboard, AI chat, browser voice controls, tasks, notes, and a restricted Owner Console.

## Current features

- Responsive navigation with a dedicated Settings shortcut.
- Local demo replies when signed out; authenticated AI chat through the `ultron-chat` Supabase Edge Function when provider secrets are configured.
- Browser speech recognition and speech synthesis for voice interaction. Availability depends on browser and device support.
- Tasks and notes stored locally while signed out, with per-user Supabase sync after sign-in.
- Private Owner Console served by `ultron-admin`, with server-side owner checks, complimentary plan management, multi-owner management, and an audit log.
- Supabase database migrations with row-level security enabled on application tables.

## Backend setup

The Supabase project uses these Edge Functions:

- `ultron-chat` — authenticated AI requests and per-user hourly quota.
- `ultron-admin` — authenticated, server-verified Owner Console actions.

The database migrations live in `supabase/migrations/`. Apply them in timestamp order to a Supabase project. Never put a Supabase secret/service-role key or an AI provider key in browser code or this public repository.

The browser configuration in `supabase-config.js` contains only the project's public publishable key. Privileged operations use server-side Edge Functions.

## Sign-in

The site uses Supabase email one-time-password links. In Supabase Auth settings, allow the published GitHub Pages URL as a redirect URL:

`https://ahmadzshan999-hub.github.io/ULTRON/`

An account must complete sign-in before it can be granted an owner role. The first owner must be assigned by a trusted project administrator after verifying the account identity.

## Not connected yet

These features remain unconfigured and are not represented as working integrations:

- Gmail and Google Calendar OAuth.
- WhatsApp Business API.
- Paid subscription checkout and payment-provider webhooks.
- Live AI until `OPENAI_API_KEY` and `OPENAI_MODEL` are configured as Supabase Edge Function secrets.

Voice input relies on browser speech-recognition support and microphone permission. Gallery uploads are temporary in the current browser session.

## Run locally

Open `index.html` in a modern browser. For a local web server, use a localhost origin and ensure the Supabase Auth redirect settings include that local URL if testing sign-in.

## Deployment

GitHub Pages is configured separately in the repository's **Settings → Pages** area. After pushing to `main`, allow Pages to publish the latest static files, then hard-refresh the browser.

Never commit passwords, access tokens, API keys, or private credentials.
