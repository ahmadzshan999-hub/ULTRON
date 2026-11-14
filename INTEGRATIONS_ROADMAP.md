# ULTRON integrations and release roadmap

## Owner Console

A read-only Owner Console is now included on the feature branch. It is hidden unless the signed-in account is verified as `owner` by the `ultron-admin` Edge Function. The owner-role table has no browser-side role-write permission. The account owner must apply the migration, assign the first owner in the Supabase SQL Editor, configure server-only function secrets, deploy the function, and test with both owner and non-owner accounts.

The first console shows aggregate task and note counts only. It does not expose private user content or allow account-wide changes.

## Gmail and Google Calendar

Use Google's official OAuth 2.0 authorization flow. Request only scopes required for the selected feature, store refresh tokens only server-side, and provide a disconnect/revoke control. Start with read-only summaries. Require explicit confirmation before sending email or creating/changing events.

Requires a Google Cloud project, OAuth consent configuration, approved redirect URI, and server-side client credentials. Never ask users for their Google password.

## WhatsApp

Use only the official WhatsApp Business Platform / Cloud API. It is intended for business messaging and has account, phone-number, template, and policy requirements; it is not a general-purpose personal WhatsApp inbox connector. Do not automate WhatsApp Web or use unofficial session scraping.

Requires Meta business setup, an eligible WhatsApp Business account/phone number, app credentials, and webhook verification. Keep tokens server-side and require confirmation before sending messages.

## Subscriptions and payments

The feature branch contains a non-purchasable plan preview only. Checkout remains disabled until an adult account owner chooses a supported provider and completes its account verification. Payment creation and webhook verification must happen server-side; never trust a browser redirect or client-submitted paid flag. Store subscription entitlements server-side. Never collect card details in ULTRON chat.

## Release checklist

- Review and merge the feature PRs in dependency order; do not merge unfinished drafts automatically.
- Apply database migrations to a test project and verify RLS with two separate accounts.
- Configure Supabase Auth redirect URLs and server-side function secrets.
- Deploy both Edge Functions and test authentication, rate limits, owner checks, error handling, and provider cost controls.
- Configure Google/Meta OAuth/API access only after the account owner authorizes it.
- Test voice input/output on supported browsers. Browser wake-word listening requires the tab open and visible.
- Test mobile/desktop layouts, keyboard navigation, and accessibility.
- Publish through GitHub Pages only after review and end-to-end tests.
