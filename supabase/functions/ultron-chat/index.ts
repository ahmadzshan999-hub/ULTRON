// ULTRON authenticated AI endpoint.
// Deploy as a Supabase Edge Function with JWT verification enabled.
// Required Supabase secret: OPENAI_API_KEY
// Required configuration: OPENAI_MODEL (choose an API model available to your provider account).
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://ahmadzshan999-hub.github.io",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
]);

function corsHeaders(origin: string | null) {
  const allowedOrigin = origin && allowedOrigins.has(origin)
    ? origin
    : "https://ahmadzshan999-hub.github.io";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405, headers);
  }
  if (origin && !allowedOrigins.has(origin)) {
    return json({ error: "Origin not allowed." }, 403, headers);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "Sign in is required." }, 401, headers);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const keysRaw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_MODEL");

  if (!supabaseUrl || !keysRaw || !openAiKey || !model) {
    return json({ error: "The ULTRON AI service is not configured yet." }, 503, headers);
  }

  let publishableKey = "";
  try {
    const keys = JSON.parse(keysRaw);
    publishableKey = keys.default ?? "";
  } catch {
    return json({ error: "Supabase function configuration is invalid." }, 503, headers);
  }
  if (!publishableKey) {
    return json({ error: "Supabase publishable key is not configured." }, 503, headers);
  }

  // The caller's JWT is checked by the Edge Function gateway and again here.
  const supabase = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return json({ error: "Your session is invalid. Please sign in again." }, 401, headers);
  }

  let body: { message?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400, headers);
  }

  if (typeof body.message !== "string" || !body.message.trim() || body.message.length > 2000) {
    return json({ error: "Message must contain 1–2,000 characters." }, 400, headers);
  }

  const rawHistory = Array.isArray(body.history) ? body.history.slice(-10) : [];
  const history: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const item of rawHistory) {
    if (
      !item ||
      (item.role !== "user" && item.role !== "assistant") ||
      typeof item.content !== "string" ||
      item.content.length > 4000
    ) {
      return json({ error: "Conversation history is invalid." }, 400, headers);
    }
    history.push({ role: item.role, content: item.content });
  }

  // Enforce a per-user server-side quota before spending provider credits.
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) {
    return json({ error: "ULTRON quota service is not configured." }, 503, headers);
  }
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: allowed, error: quotaError } = await admin.rpc("consume_ultron_ai_quota", {
    p_user_id: user.id,
  });
  if (quotaError) {
    console.error("ULTRON quota check failed:", quotaError.message);
    return json({ error: "ULTRON is temporarily unavailable. Please try again later." }, 503, headers);
  }
  if (allowed !== true) {
    return json({ error: "You've reached the ULTRON AI hourly limit. Please try again later." }, 429, headers);
  }

  try {
    const providerResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: "You are ULTRON, a helpful personal assistant. Be clear, capable, and honest. You do not have access to the user's other apps or accounts unless a connected tool explicitly provides it. Never claim you sent a message, changed an account, made a purchase, or completed an external action unless a trusted tool confirms it. Ask for confirmation before consequential actions. Do not request passwords, API keys, or payment details in chat.",
        input: [
          ...history,
          { role: "user", content: body.message.trim() },
        ],
        max_output_tokens: 700,
      }),
    });

    if (!providerResponse.ok) {
      // Do not expose provider error details or secrets to the browser.
      console.error("ULTRON provider request failed with status", providerResponse.status);
      return json({ error: "ULTRON could not get a response right now. Please try again later." }, 502, headers);
    }

    const result = await providerResponse.json();
    const reply = (result.output ?? [])
      .flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content ?? [])
      .filter((part: { type?: string }) => part.type === "output_text")
      .map((part: { text?: string }) => part.text ?? "")
      .join("\n")
      .trim() || (typeof result.output_text === "string" ? result.output_text.trim() : "");

    if (!reply) {
      return json({ error: "ULTRON received an empty response. Please try again." }, 502, headers);
    }
    return json({ reply }, 200, headers);
  } catch (error) {
    console.error("ULTRON request failed:", error instanceof Error ? error.message : "unknown error");
    return json({ error: "ULTRON is temporarily unavailable. Please try again." }, 500, headers);
  }
});
