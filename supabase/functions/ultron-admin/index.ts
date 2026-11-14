import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set(["https://ahmadzshan999-hub.github.io"]);
const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "https://ahmadzshan999-hub.github.io",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin",
});
const json = (body: unknown, status: number, headers: Record<string,string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin"), headers = cors(origin);
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405, headers);
  if (origin && !allowedOrigins.has(origin)) return json({ error: "Origin not allowed." }, 403, headers);
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Sign in is required." }, 401, headers);

  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !publishableKey || !serviceRoleKey) return json({ error: "Owner service is not configured." }, 503, headers);

  const userClient = createClient(url, publishableKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Your session is invalid." }, 401, headers);
  const { data: role, error: roleError } = await userClient.from("ultron_user_roles").select("role").eq("user_id", user.id).maybeSingle();
  if (roleError) return json({ error: "Owner permission check failed." }, 503, headers);
  if (role?.role !== "owner") return json({ error: "Owner role required." }, 403, headers);

  // Service-role access is only used after the caller's owner role is verified.
  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let body: { action?: string; email?: string; plan?: string; duration?: string };
  try { body = await req.json(); } catch { return json({ error: "Request body must be valid JSON." }, 400, headers); }
  const action = body.action ?? "overview";

  if (action === "overview") {
    const [tasks, notes, grants] = await Promise.all([
      admin.from("tasks").select("id", { count: "exact", head: true }),
      admin.from("notes").select("id", { count: "exact", head: true }),
      admin.from("ultron_entitlements").select("user_id", { count: "exact", head: true }).eq("status", "active").or("expires_at.is.null,expires_at.gt." + new Date().toISOString()),
    ]);
    if (tasks.error || notes.error || grants.error) return json({ error: "Could not load owner overview. Check that all migrations have been applied." }, 503, headers);
    return json({ role: "owner", metrics: { tasks: tasks.count ?? 0, notes: notes.count ?? 0, activeGrants: grants.count ?? 0 }, checked_at: new Date().toISOString() }, 200, headers);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400, headers);
  let target: { id: string; email?: string; email_confirmed_at?: string | null } | null = null;
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return json({ error: "Could not look up that account right now." }, 503, headers);
    target = data.users.find((candidate) => candidate.email?.toLowerCase() === email) ?? null;
    if (target || data.users.length < 1000) break;
  }
  if (!target) return json({ error: "No account found. Ask them to sign up and verify their email first." }, 404, headers);
  if (!target.email_confirmed_at) return json({ error: "That account must verify its email before receiving a complimentary plan." }, 409, headers);

  if (action === "grant") {
    if (body.plan !== "plus" && body.plan !== "pro") return json({ error: "Choose Plus or Pro." }, 400, headers);
    if (!["30", "90", "365", "forever"].includes(body.duration ?? "")) return json({ error: "Choose a valid duration." }, 400, headers);
    const now = new Date();
    const expiry = body.duration === "forever" ? null : new Date(now.getTime() + Number(body.duration) * 86400000).toISOString();
    const { error } = await admin.from("ultron_entitlements").upsert({
      user_id: target.id, plan: body.plan, status: "active", starts_at: now.toISOString(),
      expires_at: expiry, granted_by: user.id, updated_at: now.toISOString(),
    }, { onConflict: "user_id" });
    if (error) return json({ error: "Could not save the grant. Check that the entitlement migration has been applied." }, 503, headers);
    return json({ ok: true, email: target.email, plan: body.plan, expires_at: expiry, message: body.plan.toUpperCase() + " access granted at no charge." }, 200, headers);
  }
  if (action === "revoke") {
    const now = new Date().toISOString();
    const { data: revoked, error } = await admin.from("ultron_entitlements").update({
      plan: "free", status: "revoked", expires_at: now, granted_by: user.id, updated_at: now,
    }).eq("user_id", target.id).select("user_id").maybeSingle();
    if (error) return json({ error: "Could not revoke the plan." }, 503, headers);
    if (!revoked) return json({ error: "That account has no complimentary upgrade to revoke." }, 404, headers);
    return json({ ok: true, email: target.email, message: "Complimentary paid-plan access revoked." }, 200, headers);
  }
  return json({ error: "Unknown owner action." }, 400, headers);
});
