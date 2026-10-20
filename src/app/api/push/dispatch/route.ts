import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { clockInZone } from "@/lib/dates";
import { emptyData } from "@/lib/defaults";
import { dueReminders, planReminders } from "@/lib/reminders";
import type { ForgeData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return dispatch(request);
}

export async function POST(request: Request) {
  return dispatch(request);
}

async function dispatch(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, delivered: 0, reason: "Permission denied." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!url || !serviceKey || !publicKey || !privateKey) {
    return Response.json(
      {
        ok: false,
        delivered: 0,
        reason: "Web Push is not configured. No notification was sent.",
      },
      { status: 501 },
    );
  }

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:forge@localhost", publicKey, privateKey);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const subscriptions = await admin.from("push_subscriptions").select("endpoint,user_id,keys");
  if (subscriptions.error) {
    return Response.json({ ok: false, delivered: 0, reason: subscriptions.error.message }, { status: 500 });
  }
  const rows = subscriptions.data ?? [];
  if (rows.length === 0) {
    return Response.json({ ok: true, delivered: 0, reason: "No push subscriptions are stored." });
  }

  let delivered = 0;
  let failed = 0;
  const userIds = [...new Set(rows.map((row) => String(row.user_id)))];

  for (const userId of userIds) {
    const data = await loadUser(admin, userId);
    if (!data) continue;
    const clock = clockInZone(new Date(), data.profile.timezone || "UTC");
    const planned = planReminders(data, clock);
    const already = new Set(data.reminderLog.map((entry) => entry.key));
    const { due, suppressed } = dueReminders(planned, clock, already, data.settings);

    for (const reminder of suppressed) {
      await admin.from("reminder_log").upsert(
        { user_id: userId, reminder_key: reminder.key, channel: "suppressed", fired_at: new Date().toISOString() },
        { onConflict: "user_id,reminder_key" },
      );
    }

    const own = rows.filter((row) => String(row.user_id) === userId);
    for (const reminder of due) {
      let sent = 0;
      for (const subscription of own) {
        const keys = subscription.keys as { p256dh?: string; auth?: string } | null;
        if (!keys?.p256dh || !keys.auth) continue;
        try {
          await webpush.sendNotification(
            { endpoint: String(subscription.endpoint), keys: { p256dh: keys.p256dh, auth: keys.auth } },
            JSON.stringify({
              title: reminder.title,
              body: reminder.body,
              href: reminder.href,
              tag: reminder.key,
            }),
          );
          sent += 1;
          delivered += 1;
        } catch (error) {
          failed += 1;
          const status = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
          if (status === 404 || status === 410) {
            await admin.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
          }
        }
      }
      if (sent > 0) {
        await admin.from("reminder_log").upsert(
          { user_id: userId, reminder_key: reminder.key, channel: "system", fired_at: new Date().toISOString() },
          { onConflict: "user_id,reminder_key" },
        );
      }
    }
  }

  return Response.json({
    ok: true,
    delivered,
    failed,
    reason: delivered === 0 ? "No due reminder was delivered." : "Due reminders were handed to the push service.",
  });
}

async function loadUser(admin: SupabaseClient, userId: string): Promise<ForgeData | null> {
  const [profileRes, tasksRes, reviewsRes, experimentsRes, logRes] = await Promise.all([
    admin.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    admin.from("tasks").select("*").eq("user_id", userId),
    admin.from("daily_reviews").select("review_date,mood,obstacles,tomorrow_adjustment,completed_at,id").eq("user_id", userId),
    admin.from("experiments").select("*").eq("user_id", userId),
    admin.from("reminder_log").select("*").eq("user_id", userId),
  ]);
  if (profileRes.error || tasksRes.error || reviewsRes.error || experimentsRes.error || logRes.error) return null;
  const base = emptyData();
  const profile = profileRes.data;
  return {
    ...base,
    profile: {
      ...base.profile,
      timezone: typeof profile?.timezone === "string" ? profile.timezone : "UTC",
      onboarded: true,
    },
    settings: {
      ...base.settings,
      taskStartReminders: profile?.task_start_reminders !== false,
      incompleteFollowUp: Boolean(profile?.incomplete_follow_up),
      dailyReviewReminder: profile?.daily_review_reminder !== false,
      dailyReviewTime: String(profile?.daily_review_time ?? "21:00").slice(0, 5),
      quietHoursEnabled: profile?.quiet_hours_enabled !== false,
      quietStart: String(profile?.quiet_start ?? "22:00").slice(0, 5),
      quietEnd: String(profile?.quiet_end ?? "07:00").slice(0, 5),
      pauseAll: Boolean(profile?.pause_all),
    },
    tasks: (tasksRes.data ?? []).map((row) => ({
      id: String(row.id),
      seriesId: String(row.series_id),
      title: String(row.title),
      date: String(row.scheduled_date),
      time: String(row.scheduled_time).slice(0, 5),
      durationMinutes: Number(row.duration_minutes),
      category: row.category as ForgeData["tasks"][number]["category"],
      repeat: row.repeat_rule as ForgeData["tasks"][number]["repeat"],
      reminderEnabled: Boolean(row.reminder_enabled),
      status: row.status as ForgeData["tasks"][number]["status"],
      completedAt: row.completed_at ? String(row.completed_at) : null,
      reflection: String(row.reflection ?? ""),
      createdAt: String(row.created_at ?? ""),
      updatedAt: String(row.updated_at ?? ""),
    })),
    reviews: (reviewsRes.data ?? []).map((row) => ({
      id: String(row.id),
      date: String(row.review_date),
      mood: Number(row.mood) as 1 | 2 | 3 | 4 | 5,
      obstacles: String(row.obstacles ?? ""),
      tomorrowAdjustment: String(row.tomorrow_adjustment ?? ""),
      completedAt: String(row.completed_at ?? ""),
    })),
    experiments: (experimentsRes.data ?? []).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      description: String(row.description ?? ""),
      hypothesis: String(row.hypothesis ?? ""),
      measurePrompt: String(row.measure_prompt ?? ""),
      category: row.category as ForgeData["experiments"][number]["category"],
      durationDays: Number(row.duration_days),
      startDate: row.start_date ? String(row.start_date) : null,
      endDate: row.end_date ? String(row.end_date) : null,
      baseline: typeof row.baseline === "number" ? row.baseline : null,
      baselineNote: String(row.baseline_note ?? ""),
      measurements: Array.isArray(row.measurements) ? row.measurements : [],
      reflection: String(row.reflection ?? ""),
      status: row.status === "completed" ? "completed" : "active",
      decision: row.decision === "keep" || row.decision === "retest" || row.decision === "try_else" ? row.decision : null,
      reminderEnabled: Boolean(row.reminder_enabled),
      createdAt: String(row.created_at ?? ""),
      updatedAt: String(row.updated_at ?? ""),
    })),
    reminderLog: (logRes.data ?? []).map((row) => ({
      id: String(row.id),
      key: String(row.reminder_key),
      firedAt: String(row.fired_at),
      channel: row.channel === "system" || row.channel === "suppressed" ? row.channel : "in-app",
    })),
  };
}
