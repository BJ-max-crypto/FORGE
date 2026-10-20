import { addDaysISO, minutesFromTime } from "@/lib/dates";
import type { ForgeData } from "@/lib/types";
import { visibleTasks } from "@/lib/schedule";

export interface Clock {
  today: string;
  minutes: number;
}

export interface PlannedReminder {
  key: string;
  date: string;
  minutes: number;
  title: string;
  body: string;
  href: string;
}

const GRACE_MINUTES = 10;
const FOLLOW_UP_DELAY = 10;

export function isQuietTime(minutes: number, start: string, end: string): boolean {
  const quietStart = minutesFromTime(start);
  const quietEnd = minutesFromTime(end);
  if (quietStart === quietEnd) return false;
  if (quietStart < quietEnd) return minutes >= quietStart && minutes < quietEnd;
  return minutes >= quietStart || minutes < quietEnd;
}

export function planReminders(data: ForgeData, clock: Clock): PlannedReminder[] {
  if (data.settings.pauseAll) return [];
  const reminders: PlannedReminder[] = [];

  if (data.settings.taskStartReminders) {
    for (const task of visibleTasks(data.tasks)) {
      if (!task.reminderEnabled || task.status !== "scheduled") continue;
      if (task.date !== clock.today) continue;
      reminders.push({
        key: `task:${task.id}:${task.date}:${task.time}`,
        date: task.date,
        minutes: minutesFromTime(task.time),
        title: task.title,
        body: `Scheduled for ${formatClock(task.time)} · ${task.durationMinutes} min`,
        href: `/tasks/${task.id}/focus`,
      });
    }
  }

  if (data.settings.incompleteFollowUp) {
    for (const task of visibleTasks(data.tasks)) {
      if (task.status !== "scheduled" || task.date !== clock.today) continue;
      const end = minutesFromTime(task.time) + task.durationMinutes + FOLLOW_UP_DELAY;
      if (end >= 24 * 60) continue;
      reminders.push({
        key: `followup:${task.id}:${task.date}`,
        date: task.date,
        minutes: end,
        title: `Still open · ${task.title}`,
        body: "This task has not been checked in. You can complete it, skip it, or move it.",
        href: `/tasks/${task.id}/check-in`,
      });
    }
  }

  if (data.settings.dailyReviewReminder) {
    const reviewed = data.reviews.some((review) => review.date === clock.today);
    if (!reviewed) {
      reminders.push({
        key: `review:${clock.today}`,
        date: clock.today,
        minutes: minutesFromTime(data.settings.dailyReviewTime),
        title: "Daily review",
        body: "A short look at how the day went.",
        href: "/review/daily",
      });
    }
  }

  for (const experiment of data.experiments) {
    if (!experiment.reminderEnabled || experiment.status !== "active") continue;
    if (!experiment.startDate || !experiment.endDate) continue;
    if (clock.today < experiment.startDate || clock.today > experiment.endDate) continue;
    if (experiment.measurements.some((item) => item.date === clock.today)) continue;
    reminders.push({
      key: `experiment:${experiment.id}:${clock.today}`,
      date: clock.today,
      minutes: 20 * 60,
      title: experiment.title,
      body: "Log today's experiment rating while it is still fresh.",
      href: `/experiments/${experiment.id}`,
    });
  }

  return reminders;
}

export function dueReminders(
  planned: PlannedReminder[],
  clock: Clock,
  already: Set<string>,
  settings: ForgeData["settings"],
  grace = GRACE_MINUTES,
): { due: PlannedReminder[]; suppressed: PlannedReminder[] } {
  const due: PlannedReminder[] = [];
  const suppressed: PlannedReminder[] = [];
  for (const reminder of planned) {
    if (already.has(reminder.key)) continue;
    if (reminder.date !== clock.today) continue;
    const age = clock.minutes - reminder.minutes;
    if (age < 0 || age > grace) continue;
    const quiet =
      settings.quietHoursEnabled &&
      isQuietTime(reminder.minutes, settings.quietStart, settings.quietEnd);
    if (quiet) suppressed.push(reminder);
    else due.push(reminder);
  }
  return { due, suppressed };
}

export function experimentEndDate(start: string, durationDays: number): string {
  return addDaysISO(start, Math.max(durationDays, 1) - 1);
}

function formatClock(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = Number(hours);
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 || 12;
  return `${twelve}:${minutes} ${suffix}`;
}
