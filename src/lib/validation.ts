import { CATEGORIES, REPEAT_RULES, type Experiment, type ForgeData, type Goal, type Task, type TaskDraft } from "@/lib/types";
import { emptyData } from "@/lib/defaults";

export interface FieldErrors {
  title?: string;
  date?: string;
  time?: string;
  duration?: string;
  category?: string;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function validateTaskDraft(draft: TaskDraft): FieldErrors {
  const errors: FieldErrors = {};
  const title = draft.title.trim();
  if (!title) errors.title = "Name the task.";
  else if (title.length > 80) errors.title = "Keep the name under 80 characters.";
  if (!DATE_PATTERN.test(draft.date)) errors.date = "Choose a date.";
  if (!TIME_PATTERN.test(draft.time)) errors.time = "Choose a start time.";
  if (!Number.isFinite(draft.durationMinutes) || draft.durationMinutes < 5 || draft.durationMinutes > 240) {
    errors.duration = "Duration must be between 5 and 240 minutes.";
  }
  if (!CATEGORIES.includes(draft.category)) errors.category = "Choose a category.";
  if (!REPEAT_RULES.includes(draft.repeat)) errors.category = "Choose a repeat schedule.";
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asGoal(row: Record<string, unknown>): Goal[] {
  if (typeof row.id !== "string" || typeof row.title !== "string") return [];
  return [{
    id: row.id,
    title: row.title,
    description: text(row.description),
    priority: typeof row.priority === "number" ? row.priority : 0,
    isPrimary: Boolean(row.isPrimary),
    createdAt: text(row.createdAt),
    updatedAt: text(row.updatedAt),
  }];
}

function asTask(row: Record<string, unknown>): Task[] {
  if (typeof row.id !== "string" || typeof row.title !== "string" || typeof row.date !== "string" || typeof row.time !== "string") {
    return [];
  }
  const category = CATEGORIES.includes(row.category as Task["category"]) ? (row.category as Task["category"]) : "Focus";
  const repeat = REPEAT_RULES.includes(row.repeat as Task["repeat"]) ? (row.repeat as Task["repeat"]) : "none";
  const status = row.status === "completed" || row.status === "partial" || row.status === "skipped" || row.status === "cancelled"
    ? row.status
    : "scheduled";
  return [{
    id: row.id,
    seriesId: text(row.seriesId, row.id),
    title: row.title,
    date: row.date,
    time: row.time,
    durationMinutes: typeof row.durationMinutes === "number" ? row.durationMinutes : 30,
    category,
    repeat,
    reminderEnabled: Boolean(row.reminderEnabled),
    status,
    completedAt: typeof row.completedAt === "string" ? row.completedAt : null,
    reflection: text(row.reflection),
    createdAt: text(row.createdAt),
    updatedAt: text(row.updatedAt),
  }];
}

function asReview(row: Record<string, unknown>): ForgeData["reviews"] {
  if (typeof row.id !== "string" || typeof row.date !== "string") return [];
  const mood = row.mood === 1 || row.mood === 2 || row.mood === 3 || row.mood === 4 || row.mood === 5 ? row.mood : 3;
  return [{
    id: row.id,
    date: row.date,
    mood,
    obstacles: text(row.obstacles),
    tomorrowAdjustment: text(row.tomorrowAdjustment),
    completedAt: text(row.completedAt),
  }];
}

function asWeekly(row: Record<string, unknown>): ForgeData["weeklyReviews"] {
  if (typeof row.id !== "string" || typeof row.weekStart !== "string") return [];
  return [{
    id: row.id,
    weekStart: row.weekStart,
    wentWell: text(row.wentWell),
    difficult: text(row.difficult),
    patterns: text(row.patterns),
    nextFocus: text(row.nextFocus),
    completedAt: text(row.completedAt),
  }];
}

function asExperiment(row: Record<string, unknown>): Experiment[] {
  if (typeof row.id !== "string" || typeof row.title !== "string") return [];
  const category = row.category === "Learning" || row.category === "Energy" ? row.category : "Focus";
  return [{
    id: row.id,
    title: row.title,
    description: text(row.description),
    hypothesis: text(row.hypothesis),
    measurePrompt: text(row.measurePrompt, "How did this go today, from 1 to 10?"),
    category,
    durationDays: typeof row.durationDays === "number" ? row.durationDays : 14,
    startDate: typeof row.startDate === "string" ? row.startDate : null,
    endDate: typeof row.endDate === "string" ? row.endDate : null,
    baseline: typeof row.baseline === "number" ? row.baseline : null,
    baselineNote: text(row.baselineNote),
    measurements: Array.isArray(row.measurements) ? row.measurements.filter(isRecord).flatMap((item) => {
      if (typeof item.date !== "string" || typeof item.value !== "number") return [];
      return [{ date: item.date, value: item.value, note: text(item.note) }];
    }) : [],
    reflection: text(row.reflection),
    status: row.status === "completed" ? "completed" : "active",
    decision: row.decision === "keep" || row.decision === "retest" || row.decision === "try_else" ? row.decision : null,
    reminderEnabled: Boolean(row.reminderEnabled),
    createdAt: text(row.createdAt),
    updatedAt: text(row.updatedAt),
  }];
}

export function sanitizeImport(value: unknown): ForgeData | null {
  if (!isRecord(value)) return null;
  const base = emptyData();
  const profile = isRecord(value.profile) ? value.profile : null;
  if (!profile || typeof profile.displayName !== "string") return null;
  if (!Array.isArray(value.tasks) || !Array.isArray(value.goals) || !Array.isArray(value.reviews)) {
    return null;
  }
  const settings = isRecord(value.settings) ? value.settings : {};
  return {
    ...base,
    profile: {
      displayName: profile.displayName.slice(0, 40),
      areas: Array.isArray(profile.areas) ? profile.areas.filter((item) => typeof item === "string").slice(0, 8) : [],
      onboarded: Boolean(profile.onboarded),
      timezone: typeof profile.timezone === "string" ? profile.timezone : base.profile.timezone,
    },
    goals: value.goals.filter(isRecord).slice(0, 50).flatMap(asGoal),
    tasks: value.tasks.filter(isRecord).slice(0, 2000).flatMap(asTask),
    reviews: value.reviews.filter(isRecord).slice(0, 1000).flatMap(asReview),
    weeklyReviews: Array.isArray(value.weeklyReviews)
      ? value.weeklyReviews.filter(isRecord).slice(0, 200).flatMap(asWeekly)
      : [],
    experiments: Array.isArray(value.experiments)
      ? value.experiments.filter(isRecord).slice(0, 200).flatMap(asExperiment)
      : [],
    settings: { ...base.settings, ...settings } as ForgeData["settings"],
    reminderLog: Array.isArray(value.reminderLog)
      ? value.reminderLog.filter(isRecord).slice(0, 200).flatMap((entry) => {
          if (typeof entry.key !== "string" || typeof entry.firedAt !== "string") return [];
          const channel = entry.channel === "system" || entry.channel === "suppressed" ? entry.channel : "in-app";
          return [{
            id: typeof entry.id === "string" ? entry.id : entry.key,
            key: entry.key,
            firedAt: entry.firedAt,
            channel,
          }];
        })
      : [],
  };
}
