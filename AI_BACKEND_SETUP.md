# ULTRON AI backend setup

ULTRON's AI requests run through the authenticated Supabase Edge Function `ultron-chat`. Provider keys stay in Supabase Function Secrets and are never sent to the browser.

## Recommended low-cost setup: Gemini

Google currently offers free API access for selected Gemini models through Google AI Studio. The free tier has rate limits and its data-use terms differ from the paid tier; do not send passwords, private documents, or sensitive personal information through a free-tier provider. Free access is not unlimited and availability/quotas can change.

1. Open [Google AI Studio](https://aistudio.google.com/) and create an API key. Do not paste the key into ChatGPT, GitHub, HTML, or browser JavaScript.
2. In the Supabase Dashboard for the ULTRON project, open **Edge Functions → Secrets**.
3. Add these secrets:
   - `GEMINI_API_KEY` — the private key from Google AI Studio.
   - `GEMINI_MODEL` — `gemini-3.6-flash` (or another model available to your account).
   - `AI_PROVIDER` — `gemini`.
4. Deploy the `ultron-chat` function from this repository with JWT verification enabled.
5. Sign in to ULTRON and send a test message. The function should return a reply with provider metadata `gemini`.

The function uses Gemini's `generateContent` REST API with a high thinking level, a larger response budget, conversation history, and a server-side system instruction. The model reasons internally; ULTRON returns only the answer, not private chain-of-thought.

Official references:
- [Gemini API pricing and free tier](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini thinking controls](https://ai.google.dev/gemini-api/docs/thinking)
- [Gemini Generate Content API](https://ai.google.dev/api/generate-content)

## Optional OpenAI provider

If an adult account owner chooses to configure a paid OpenAI API account instead, add:
- `OPENAI_API_KEY` — private provider key.
- `OPENAI_MODEL` — a model identifier enabled for that account.
- `AI_PROVIDER` — `openai`.

OpenAI API usage is billed separately from a ChatGPT subscription. Do not assume a ChatGPT plan includes API credits.

## Provider selection

- If `AI_PROVIDER` is set to `gemini`, ULTRON uses Gemini.
- If `AI_PROVIDER` is set to `openai`, ULTRON uses OpenAI.
- If `AI_PROVIDER` is omitted, ULTRON selects Gemini when `GEMINI_API_KEY` exists; otherwise it selects OpenAI when configured.
- The function does not silently switch to a paid provider after a free provider fails.

## Security and limits

- Supabase JWT verification stays enabled.
- The function verifies the user's session again before processing a message.
- A server-side quota is checked before a provider request; the current database quota is 30 requests per user per rolling hour.
- The provider key and Supabase service-role key remain server-side.
- The function validates message and history sizes and returns generic provider errors without exposing secret values.
- The free Gemini tier may use submitted content to improve Google's products. Avoid sending sensitive data unless the provider's current terms and your account settings are appropriate.

## What is not built yet

This is a strong text-chat foundation, not yet a full ChatGPT replacement. Live web search, citations, file/PDF understanding, tool calling, code execution, and durable AI memory require separate implementation and testing. Voice currently uses browser speech recognition and speech synthesis, not a native always-listening assistant.

## Troubleshooting

- **AI provider key has not been added:** add the Gemini secrets above in Supabase Function Secrets.
- **Provider key rejected:** create a new key in the provider dashboard and replace the secret there; never share the key in chat.
- **Rate limit reached:** wait for the provider or ULTRON quota window to reset.
- **AI service not configured:** confirm the secret names exactly and redeploy the Edge Function.
