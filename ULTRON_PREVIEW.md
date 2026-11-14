# ULTRON Command Centre — Preview 0.2

This branch refreshes the front-end experience. It is intentionally a local preview, not a deployed AI product.

## Included
- Responsive command-centre dashboard and navigation
- Local task and notes tools (browser localStorage)
- Built-in demo replies, clearly labelled as not being a live AI model
- Optional browser speech-to-text where the browser supports the Web Speech API
- Voice transcripts are reviewed by the user before sending
- Dark/light theme and local data reset

## Not live
- No live model API connection or backend AI endpoint
- No Supabase authentication or cloud sync
- No WhatsApp, Gmail, calendar, or other connected accounts
- No subscriptions, payment processing, or Owner Console
- No wake-word listener or background microphone access

## Security direction
A real AI connection must run through a trusted server-side endpoint. Provider secret keys must never be placed in index.html, script.js, browser storage, or a public GitHub repository. Authentication, per-user data access, and rate limits must be enforced server-side. External integrations should use official OAuth/API flows, least-privilege scopes, revocable access, and explicit confirmation before sending messages or emails.

The Supabase schema work is tracked separately in the preceding data-foundation pull request. This UI branch does not execute SQL or connect to the Supabase project.

GitHub Pages deployment occurs only after the relevant pull requests are reviewed and merged. This branch itself does not change the live site.
