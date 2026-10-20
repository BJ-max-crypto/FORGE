export const CATEGORIES = [
  "Focus",
  "Learning",
  "Health",
  "Craft",
  "Admin",
  "Personal",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const EXPERIMENT_CATEGORIES = ["Focus", "Learning", "Energy"] as const;
export type ExperimentCategory = (typeof EXPERIMENT_CATEGORIES)[number];

export const REPEAT_RULES = ["none", "daily", "weekdays", "weekly"] as const;
export type RepeatRule = (typeof REPEAT_RULES)[number];

export const TASK_STATUSES = [
  "scheduled",
  "completed",
  "partial",
  "skipped",
  "cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const AREAS = [
  "Focus",
  "Learning",
  "Health",
  "Craft",
  "Relationships",
  "Energy",
] as const;

export interface Task {
  id: string;
  seriesId: string;
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  category: Category;
  repeat: RepeatRule;
  reminderEnabled: boolean;
  status: TaskStatus;
  completedAt: string | null;
  reflection: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReview {
  id: string;
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  obstacles: string;
  tomorrowAdjustment: string;
  completedAt: string;
}

export interface WeeklyReview {
  id: string;
  weekStart: string;
  wentWell: string;
  difficult: string;
  patterns: string;
  nextFocus: string;
  completedAt: string;
}

export interface Measurement {
  date: string;
  value: number;
  note: string;
}

export interface Experiment {
  id: string;
  title: string;
  description: string;
  hypothesis: string;
  measurePrompt: string;
  category: ExperimentCategory;
  durationDays: number;
  startDate: string | null;
  endDate: string | null;
  baseline: number | null;
  baselineNote: string;
  measurements: Measurement[];
  reflection: string;
  status: "active" | "completed";
  decision: "keep" | "retest" | "try_else" | null;
  reminderEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  priority: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  displayName: string;
  areas: string[];
  onboarded: boolean;
  timezone: string;
}

export interface Settings {
  taskStartReminders: boolean;
  incompleteFollowUp: boolean;
  dailyReviewReminder: boolean;
  dailyReviewTime: string;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  pauseAll: boolean;
  textSize: "default" | "large";
  reduceMotion: boolean;
}

export interface ReminderLogEntry {
  id: string;
  key: string;
  firedAt: string;
  channel: "in-app" | "system" | "suppressed";
}

export interface ForgeData {
  profile: Profile;
  goals: Goal[];
  tasks: Task[];
  reviews: DailyReview[];
  weeklyReviews: WeeklyReview[];
  experiments: Experiment[];
  settings: Settings;
  reminderLog: ReminderLogEntry[];
}

export interface TaskDraft {
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  repeat: RepeatRule;
  category: Category;
  reminderEnabled: boolean;
}

export type LoadResult =
  | { ok: true; data: ForgeData }
  | { ok: false; reason: "unauthenticated" | "error"; message: string };

export interface ForgeRepository {
  mode: "demo" | "supabase";
  load(): Promise<LoadResult>;
  save(data: ForgeData): Promise<void>;
}
