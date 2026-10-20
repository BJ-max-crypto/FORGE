import type { SupabaseClient } from "@supabase/supabase-js";
import type { ForgeData, ForgeRepository, LoadResult } from "@/lib/types";
import { emptyData } from "@/lib/defaults";

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

type Row = Record<string, unknown>;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function createSupabaseRepository(): ForgeRepository {
  return {
    mode: "supabase",
    async load(): Promise<LoadResult> {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        return { ok: false, reason: "error", message: "Supabase environment variables are missing." };
      }
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(url, key);
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) {
        return { ok: false, reason: "error", message: sessionError.message };
      }
      const user = sessionData.session?.user;
      if (!user) {
        return {
          ok: false,
          reason: "unauthenticated",
          message: "Supabase is configured, but nobody is signed in. FORGE will not mix this with demo data.",
        };
      }

      const [profileRes, goalsRes, tasksRes, reviewsRes, weeklyRes, experimentsRes, remindersRes] = await Promise.all([
        client.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        client.from("goals").select("*").eq("user_id", user.id),
        client.from("tasks").select("*").eq("user_id", user.id),
        client.from("daily_reviews").select("*").eq("user_id", user.id),
        client.from("weekly_reviews").select("*").eq("user_id", user.id),
        client.from("experiments").select("*").eq("user_id", user.id),
        client.from("reminder_log").select("*").eq("user_id", user.id),
      ]);

      const failed = [profileRes, goalsRes, tasksRes, reviewsRes, weeklyRes, experimentsRes, remindersRes].find((result) => result.error);
      if (failed?.error) {
        const denied = failed.error.code === "42501" || /permission|rls/i.test(failed.error.message);
        return {
          ok: false,
          reason: denied ? "error" : "error",
          message: denied
            ? "Permission denied. Row-level security blocked this account from reading its data."
            : failed.error.message,
        };
      }

      const base = emptyData();
      const profile = profileRes.data as Row | null;
      const data: ForgeData = {
        profile: {
          displayName: asString(profile?.display_name),
          areas: Array.isArray(profile?.areas) ? (profile?.areas as string[]) : [],
          onboarded: Boolean(profile?.onboarded),
          timezone: asString(profile?.timezone, base.profile.timezone),
        },
        settings: {
          ...base.settings,
          taskStartReminders: profile?.task_start_reminders !== false,
          incompleteFollowUp: Boolean(profile?.incomplete_follow_up),
          dailyReviewReminder: profile?.daily_review_reminder !== false,
          dailyReviewTime: asString(profile?.daily_review_time, "21:00").slice(0, 5),
          quietHoursEnabled: profile?.quiet_hours_enabled !== false,
          quietStart: asString(profile?.quiet_start, "22:00").slice(0, 5),
          quietEnd: asString(profile?.quiet_end, "07:00").slice(0, 5),
          pauseAll: Boolean(profile?.pause_all),
          textSize: profile?.text_size === "large" ? "large" : "default",
          reduceMotion: Boolean(profile?.reduce_motion),
        },
        goals: ((goalsRes.data ?? []) as Row[]).map((row) => ({
          id: asString(row.id),
          title: asString(row.title),
          description: asString(row.description),
          priority: asNumber(row.priority),
          isPrimary: Boolean(row.is_primary),
          createdAt: asString(row.created_at),
          updatedAt: asString(row.updated_at),
        })),
        tasks: ((tasksRes.data ?? []) as Row[]).map((row) => ({
          id: asString(row.id),
          seriesId: asString(row.series_id),
          title: asString(row.title),
          date: asString(row.scheduled_date),
          time: asString(row.scheduled_time).slice(0, 5),
          durationMinutes: asNumber(row.duration_minutes, 30),
          category: asString(row.category, "Focus") as ForgeData["tasks"][number]["category"],
          repeat: asString(row.repeat_rule, "none") as ForgeData["tasks"][number]["repeat"],
          reminderEnabled: Boolean(row.reminder_enabled),
          status: asString(row.status, "scheduled") as ForgeData["tasks"][number]["status"],
          completedAt: row.completed_at ? asString(row.completed_at) : null,
          reflection: asString(row.reflection),
          createdAt: asString(row.created_at),
          updatedAt: asString(row.updated_at),
        })),
        reviews: ((reviewsRes.data ?? []) as Row[]).map((row) => ({
          id: asString(row.id),
          date: asString(row.review_date),
          mood: Math.min(5, Math.max(1, asNumber(row.mood, 3))) as 1 | 2 | 3 | 4 | 5,
          obstacles: asString(row.obstacles),
          tomorrowAdjustment: asString(row.tomorrow_adjustment),
          completedAt: asString(row.completed_at),
        })),
        weeklyReviews: ((weeklyRes.data ?? []) as Row[]).map((row) => ({
          id: asString(row.id),
          weekStart: asString(row.week_start),
          wentWell: asString(row.went_well),
          difficult: asString(row.difficult),
          patterns: asString(row.patterns),
          nextFocus: asString(row.next_focus),
          completedAt: asString(row.completed_at),
        })),
        experiments: ((experimentsRes.data ?? []) as Row[]).map((row) => ({
          id: asString(row.id),
          title: asString(row.title),
          description: asString(row.description),
          hypothesis: asString(row.hypothesis),
          measurePrompt: asString(row.measure_prompt, "How did this go today, from 1 to 10?"),
          category: asString(row.category, "Focus") as ForgeData["experiments"][number]["category"],
          durationDays: asNumber(row.duration_days, 14),
          startDate: row.start_date ? asString(row.start_date) : null,
          endDate: row.end_date ? asString(row.end_date) : null,
          baseline: typeof row.baseline === "number" ? row.baseline : null,
          baselineNote: asString(row.baseline_note),
          measurements: Array.isArray(row.measurements) ? (row.measurements as ForgeData["experiments"][number]["measurements"]) : [],
          reflection: asString(row.reflection),
          status: row.status === "completed" ? "completed" : "active",
          decision:
            row.decision === "keep" || row.decision === "retest" || row.decision === "try_else"
              ? row.decision
              : null,
          reminderEnabled: Boolean(row.reminder_enabled),
          createdAt: asString(row.created_at),
          updatedAt: asString(row.updated_at),
        })),
        reminderLog: ((remindersRes.data ?? []) as Row[]).map((row) => ({
          id: asString(row.id),
          key: asString(row.reminder_key),
          firedAt: asString(row.fired_at),
          channel: row.channel === "system" || row.channel === "suppressed" ? row.channel : "in-app",
        })),
      };
      return { ok: true, data };
    },
    async save(data: ForgeData): Promise<void> {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) throw new Error("Supabase is not configured.");
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(url, key);
      const { data: sessionData } = await client.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) throw new Error("Permission denied. Sign in before saving.");
      const userId = user.id;

      const profileRow = {
        user_id: userId,
        display_name: data.profile.displayName,
        areas: data.profile.areas,
        onboarded: data.profile.onboarded,
        timezone: data.profile.timezone,
        task_start_reminders: data.settings.taskStartReminders,
        incomplete_follow_up: data.settings.incompleteFollowUp,
        daily_review_reminder: data.settings.dailyReviewReminder,
        daily_review_time: data.settings.dailyReviewTime,
        quiet_hours_enabled: data.settings.quietHoursEnabled,
        quiet_start: data.settings.quietStart,
        quiet_end: data.settings.quietEnd,
        pause_all: data.settings.pauseAll,
        text_size: data.settings.textSize,
        reduce_motion: data.settings.reduceMotion,
        updated_at: new Date().toISOString(),
      };

      const profileResult = await client.from("profiles").upsert(profileRow);
      if (profileResult.error) throw new Error(profileResult.error.message);

      await replaceRows(client, "goals", userId, data.goals.map((goal) => ({
        id: goal.id,
        user_id: userId,
        title: goal.title,
        description: goal.description,
        priority: goal.priority,
        is_primary: goal.isPrimary,
        created_at: goal.createdAt,
        updated_at: goal.updatedAt,
      })));
      await replaceRows(client, "tasks", userId, data.tasks.map((task) => ({
        id: task.id,
        user_id: userId,
        series_id: task.seriesId,
        title: task.title,
        scheduled_date: task.date,
        scheduled_time: task.time,
        duration_minutes: task.durationMinutes,
        category: task.category,
        repeat_rule: task.repeat,
        reminder_enabled: task.reminderEnabled,
        status: task.status,
        completed_at: task.completedAt,
        reflection: task.reflection,
        created_at: task.createdAt,
        updated_at: task.updatedAt,
      })));
      await replaceRows(client, "daily_reviews", userId, data.reviews.map((review) => ({
        id: review.id,
        user_id: userId,
        review_date: review.date,
        mood: review.mood,
        obstacles: review.obstacles,
        tomorrow_adjustment: review.tomorrowAdjustment,
        completed_at: review.completedAt,
      })));
      await replaceRows(client, "weekly_reviews", userId, data.weeklyReviews.map((review) => ({
        id: review.id,
        user_id: userId,
        week_start: review.weekStart,
        went_well: review.wentWell,
        difficult: review.difficult,
        patterns: review.patterns,
        next_focus: review.nextFocus,
        completed_at: review.completedAt,
      })));
      await replaceRows(client, "experiments", userId, data.experiments.map((experiment) => ({
        id: experiment.id,
        user_id: userId,
        title: experiment.title,
        description: experiment.description,
        hypothesis: experiment.hypothesis,
        measure_prompt: experiment.measurePrompt,
        category: experiment.category,
        duration_days: experiment.durationDays,
        start_date: experiment.startDate,
        end_date: experiment.endDate,
        baseline: experiment.baseline,
        baseline_note: experiment.baselineNote,
        measurements: experiment.measurements,
        reflection: experiment.reflection,
        status: experiment.status,
        decision: experiment.decision,
        reminder_enabled: experiment.reminderEnabled,
        created_at: experiment.createdAt,
        updated_at: experiment.updatedAt,
      })));
      await replaceRows(client, "reminder_log", userId, data.reminderLog.map((entry) => ({
        id: entry.id,
        user_id: userId,
        reminder_key: entry.key,
        channel: entry.channel,
        fired_at: entry.firedAt,
      })));
    },
  };
}

async function replaceRows(
  client: SupabaseClient,
  table: string,
  userId: string,
  rows: Record<string, unknown>[],
): Promise<void> {
  if (rows.length > 0) {
    const upserted = await client.from(table).upsert(rows);
    if (upserted.error) throw new Error(upserted.error.message);
  }
  const existing = await client.from(table).select("id").eq("user_id", userId);
  if (existing.error) throw new Error(existing.error.message);
  const keep = new Set(rows.map((row) => String(row.id)));
  const remove = ((existing.data ?? []) as { id: string }[])
    .map((row) => row.id)
    .filter((id) => !keep.has(id));
  if (remove.length === 0) return;
  const deleted = await client.from(table).delete().eq("user_id", userId).in("id", remove);
  if (deleted.error) throw new Error(deleted.error.message);
}
