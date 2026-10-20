import type { ExperimentCategory, ForgeData, Settings } from "@/lib/types";

export const defaultSettings = (): Settings => ({
  taskStartReminders: true,
  incompleteFollowUp: false,
  dailyReviewReminder: true,
  dailyReviewTime: "21:00",
  quietHoursEnabled: true,
  quietStart: "22:00",
  quietEnd: "07:00",
  pauseAll: false,
  textSize: "default",
  reduceMotion: false,
});

export function emptyData(timeZone = "UTC"): ForgeData {
  return {
    profile: {
      displayName: "",
      areas: [],
      onboarded: false,
      timezone: timeZone,
    },
    goals: [],
    tasks: [],
    reviews: [],
    weeklyReviews: [],
    experiments: [],
    settings: defaultSettings(),
    reminderLog: [],
  };
}

export interface ExperimentPreset {
  id: string;
  category: ExperimentCategory;
  title: string;
  description: string;
  hypothesis: string;
  measurePrompt: string;
  durationDays: number;
}

export const EXPERIMENT_PRESETS: ExperimentPreset[] = [
  {
    id: "morning-block",
    category: "Focus",
    title: "Deep work before noon",
    description:
      "Protect one uninterrupted block before lunch. Record how much of the block you actually used.",
    hypothesis: "A morning focus block increases how much of my planned work gets finished.",
    measurePrompt: "How much of the planned block did you use, from 1 to 10?",
    durationDays: 14,
  },
  {
    id: "phone-away",
    category: "Focus",
    title: "Phone in another room",
    description:
      "Leave your phone outside the room for the first work block. Rate how steady your attention felt.",
    hypothesis: "Keeping the phone out of reach makes the first block less fragmented.",
    measurePrompt: "How steady was your attention during the block, from 1 to 10?",
    durationDays: 7,
  },
  {
    id: "twenty-pages",
    category: "Learning",
    title: "Read 20 pages",
    description: "Read twenty pages of one book at the same time each day.",
    hypothesis: "A small fixed reading target is easier to keep than an open-ended session.",
    measurePrompt: "How fully did you meet the 20-page target, from 1 to 10?",
    durationDays: 21,
  },
  {
    id: "one-note",
    category: "Learning",
    title: "One concept note",
    description: "Write a short note on a single idea you want to remember.",
    hypothesis: "Writing one idea in my own words helps me retain what I studied.",
    measurePrompt: "How clear is the idea after writing the note, from 1 to 10?",
    durationDays: 14,
  },
  {
    id: "morning-light",
    category: "Energy",
    title: "Morning light walk",
    description: "Take a ten-minute walk outside within an hour of waking.",
    hypothesis: "Morning light and a short walk make the rest of the morning feel steadier.",
    measurePrompt: "How was your energy through the morning, from 1 to 10?",
    durationDays: 14,
  },
  {
    id: "caffeine-cutoff",
    category: "Energy",
    title: "Caffeine cutoff at 2 PM",
    description: "Stop caffeine at 2:00 PM and notice how the evening feels.",
    hypothesis: "An earlier caffeine cutoff makes it easier to wind down at night.",
    measurePrompt: "How easily did you wind down in the evening, from 1 to 10?",
    durationDays: 10,
  },
];

export const MOODS: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 1, label: "Heavy" },
  { value: 2, label: "Uneven" },
  { value: 3, label: "Steady" },
  { value: 4, label: "Good" },
  { value: 5, label: "Clear" },
];
