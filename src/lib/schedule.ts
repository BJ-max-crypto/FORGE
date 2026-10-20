import { addDaysISO, weekdayIndex } from "@/lib/dates";
import type { RepeatRule, Task } from "@/lib/types";

export function ruleMatches(rule: RepeatRule, anchorDate: string, day: string): boolean {
  if (rule === "none") return false;
  if (day < anchorDate) return false;
  if (rule === "daily") return true;
  const dow = weekdayIndex(day);
  if (rule === "weekdays") return dow !== 0 && dow !== 6;
  return dow === weekdayIndex(anchorDate);
}

export function materializeTasks(
  tasks: Task[],
  today: string,
  nowIso: string,
  createId: () => string,
): Task[] {
  const groups = new Map<string, Task[]>();
  for (const task of tasks) {
    const list = groups.get(task.seriesId) ?? [];
    list.push(task);
    groups.set(task.seriesId, list);
  }

  const created: Task[] = [];
  for (const [seriesId, list] of groups) {
    list.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
    if (list.some((task) => task.date === today)) continue;
    const anchor = list[0];
    const template = [...list].reverse().find((task) => task.status !== "cancelled") ?? list[list.length - 1];
    if (!ruleMatches(template.repeat, anchor.date, today)) continue;
    created.push({
      id: createId(),
      seriesId,
      title: template.title,
      date: today,
      time: template.time,
      durationMinutes: template.durationMinutes,
      category: template.category,
      repeat: template.repeat,
      reminderEnabled: template.reminderEnabled,
      status: "scheduled",
      completedAt: null,
      reflection: "",
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }
  return created;
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.time.localeCompare(b.time) || a.createdAt.localeCompare(b.createdAt));
}

export function visibleTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.status !== "cancelled");
}

export function tasksOnDate(tasks: Task[], date: string): Task[] {
  return sortTasks(visibleTasks(tasks).filter((task) => task.date === date));
}

export function nextTask(tasks: Task[], date: string, minutesNow: number): Task | null {
  const open = tasksOnDate(tasks, date).filter((task) => task.status === "scheduled");
  if (open.length === 0) return null;
  const upcoming = open.find((task) => {
    const [hours, minutes] = task.time.split(":").map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0) >= minutesNow;
  });
  return upcoming ?? open[open.length - 1];
}

export function shiftDate(date: string, days: number): string {
  return addDaysISO(date, days);
}
