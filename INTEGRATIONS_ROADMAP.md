# ULTRON integrations and release roadmap

This document separates code that can be prepared in the repository from services that require the account owner to configure and authorize external providers.

## 1. Owner Console

Use Supabase Auth for sign-in and a server-managed role assignment for authorization. Do not create a shared owner password in browser JavaScript or ask the owner to send a password through chat.

Before enabling the console:
- Add a private user-role table with no client-side role-write permissions.
- Assign the first owner role through a trusted Supabase administrator action after the owner's account exists.
- Require every administrative Edge Function to verify the signed-in user's owner role server-side.
- Log administrative actions and protect account-wide operations with confirmation.
- Keep the console hidden until the server confirms the owner role.

No owner role is assigned and no admin console is enabled in this preview.

## 2. Gmail and Google Calendar

Use Google's official OAuth 2.0 authorization flow. Request only the scopes needed for the selected feature, store refresh tokens only in a protected server-side store, and provide a disconnect/revoke control. Start with read-only calendar/email summaries; require explicit confirmation before sending email or creating/changing events.

Requires a Google Cloud project, OAuth consent configuration, approved redirect URI, and server-side client credentials. Do not ask users for their Google password.

## 3. WhatsApp

Do not attempt to control a personal WhatsApp account by automating WhatsApp Web, scraping QR sessions, or using unofficial reverse-engineered APIs. The supported integration path for a website is the official WhatsApp Business Platform / Cloud API, which is designed for business messaging and has account, phone-number, template, and policy requirements. It is not a general-purpose personal WhatsApp inbox connector.

Requires a Meta business setup, an approved WhatsApp Business account/phone number, app credentials, and webhook verification. Keep tokens server-side and require confirmation before sending messages.

## 4. Subscriptions and payments

Keep checkout disabled until the account owner chooses a supported payment provider and completes its business/account verification. Implement payment creation and webhook verification on the server; never trust a browser redirect or client-submitted “paid” flag. Store subscription entitlements server-side and enforce them in the backend.

Provider account setup, billing, and legal/business details should be handled by the adult account owner where required. Do not collect card numbers or bank details inside ULTRON chat.

## 5. Release checklist

- Review and merge PRs in dependency order; do not merge unfinished drafts.
- Apply database migrations to a test project and verify RLS with two separate accounts.
- Configure Supabase Auth redirect URLs.
- Configure provider secrets in Supabase Function Secrets.
- Deploy Edge Functions and test authentication, rate limits, error handling, and provider cost controls.
- Test voice input/output on supported browsers. Browser wake-word listening requires the tab open and visible; it is not an operating-system wake word.
- Test mobile/desktop layouts, keyboard navigation, and accessibility.
- Publish through GitHub Pages only after review and end-to-end tests.
