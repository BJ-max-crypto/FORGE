import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!url || !anon || !service || !publicKey || !privateKey) {
    return Response.json(
      {
        ok: false,
        stored: false,
        delivered: false,
        reason:
          "Web Push is not configured. Set the VAPID keys and SUPABASE_SERVICE_ROLE_KEY before subscriptions can be stored. Nothing was delivered.",
      },
      { status: 501 },
    );
  }

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return Response.json(
      { ok: false, stored: false, delivered: false, reason: "Permission denied. Sign in before saving a push subscription." },
      { status: 401 },
    );
  }

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data: userData, error } = await userClient.auth.getUser();
  if (error || !userData.user) {
    return Response.json(
      { ok: false, stored: false, delivered: false, reason: "Permission denied." },
      { status: 403 },
    );
  }

  const body = (await request.json()) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!body.endpoint || !body.keys?.p256dh || !body.keys.auth) {
    return Response.json(
      { ok: false, stored: false, delivered: false, reason: "Subscription payload is incomplete." },
      { status: 400 },
    );
  }

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { error: insertError } = await admin.from("push_subscriptions").upsert(
    {
      endpoint: body.endpoint,
      user_id: userData.user.id,
      keys: body.keys,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
  if (insertError) {
    return Response.json(
      { ok: false, stored: false, delivered: false, reason: insertError.message },
      { status: 500 },
    );
  }

  return Response.json({
    ok: true,
    stored: true,
    delivered: false,
    reason: "Subscription stored. A notification is delivered only when the dispatch job sends it.",
  });
}
