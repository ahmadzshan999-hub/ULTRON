import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set(["https://ahmadzshan999-hub.github.io"]);
const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "https://ahmadzshan999-hub.github.io",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});
const json = (body: unknown, status: number, headers: Record<string,string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const headers = cors(origin);
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405, headers);
  if (origin && !allowedOrigins.has(origin)) return json({ error: "Origin not allowed." }, 403, headers);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Sign in is required." }, 401, headers);

  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !publishableKey || !serviceRoleKey) return json({ error: "Owner service is not configured." }, 503, headers);

  const userClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Your session is invalid." }, 401, headers);

  const { data: role, error: roleError } = await userClient
    .from("ultron_user_roles").select("role").eq("user_id", user.id).maybeSingle();
  if (roleError) return json({ error: "Owner permission check failed." }, 503, headers);
  if (role?.role !== "owner") return json({ error: "Owner role required." }, 403, headers);

  // The service-role key is used only after the user's owner role is verified.
  // It must exist only in Supabase Function Secrets and never in the browser.
  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const [tasks, notes] = await Promise.all([
    admin.from("tasks").select("id", { count: "exact", head: true }),
    admin.from("notes").select("id", { count: "exact", head: true }),
  ]);
  if (tasks.error || notes.error) return json({ error: "Could not load owner overview." }, 503, headers);
  return json({
    role: "owner",
    metrics: { tasks: tasks.count ?? 0, notes: notes.count ?? 0 },
    checked_at: new Date().toISOString(),
  }, 200, headers);
});
