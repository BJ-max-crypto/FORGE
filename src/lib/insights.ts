import type { Task } from "@/lib/types";
import { minutesFromTime } from "@/lib/dates";

export interface PeriodStats {
  completed: number;
  partial: number;
  skipped: number;
  open: number;
  total: number;
  rate: number | null;
}

export interface DayStat {
  date: string;
  total: number;
  completed: number;
  rate: number | null;
}

export interface CategoryStat {
  category: string;
  total: number;
  completed: number;
  rate: number;
}

export interface Insight {
  id: string;
  text: string;
}

function counted(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.status !== "cancelled");
}

export function periodStats(tasks: Task[], from: string, to: string): PeriodStats {
  const relevant = counted(tasks).filter((task) => task.date >= from && task.date <= to);
  const completed = relevant.filter((task) => task.status === "completed").length;
  const partial = relevant.filter((task) => task.status === "partial").length;
  const skipped = relevant.filter((task) => task.status === "skipped").length;
  const open = relevant.filter((task) => task.status === "scheduled").length;
  const total = relevant.length;
  return {
    completed,
    partial,
    skipped,
    open,
    total,
    rate: total === 0 ? null : completed / total,
  };
}

export function dailyRates(tasks: Task[], days: string[]): DayStat[] {
  return days.map((date) => {
    const stats = periodStats(tasks, date, date);
    return {
      date,
      total: stats.total,
      completed: stats.completed,
      rate: stats.rate,
    };
  });
}

export function categoryRates(tasks: Task[], from: string, to: string): CategoryStat[] {
  const relevant = counted(tasks).filter((task) => task.date >= from && task.date <= to);
  const groups = new Map<string, Task[]>();
  for (const task of relevant) {
    const list = groups.get(task.category) ?? [];
    list.push(task);
    groups.set(task.category, list);
  }
  return [...groups.entries()]
    .map(([category, list]) => {
      const completed = list.filter((task) => task.status === "completed").length;
      return {
        category,
        total: list.length,
        completed,
        rate: completed / list.length,
      };
    })
    .sort((a, b) => b.rate - a.rate || b.total - a.total);
}

export function compareRates(current: number | null, previous: number | null): string | null {
  if (current == null || previous == null) return null;
  const diff = Math.round(current * 100) - Math.round(previous * 100);
  if (diff === 0) return "Same completion rate as the previous period.";
  if (diff > 0) return `${diff} points higher than the previous period.`;
  return `${Math.abs(diff)} points lower than the previous period.`;
}

export function formatPercent(rate: number | null): string {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}%`;
}

export function insightsFor(tasks: Task[], from: string, to: string): Insight[] {
  const relevant = counted(tasks).filter((task) => task.date >= from && task.date <= to);
  if (relevant.length === 0) return [];

  const insights: Insight[] = [];
  const overall = periodStats(tasks, from, to);
  if (overall.rate === 1) {
    insights.push({
      id: "all-complete",
      text: "Every scheduled task in this period was marked completed.",
    });
  } else if (overall.completed === 0 && overall.total > 0) {
    insights.push({
      id: "none-complete",
      text: "None of the scheduled tasks in this period were marked completed.",
    });
  }

  if (overall.partial > 0) {
    insights.push({
      id: "partial",
      text: `${overall.partial} ${overall.partial === 1 ? "task was" : "tasks were"} marked partly completed. Those are not counted as finished.`,
    });
  }

  const categories = categoryRates(tasks, from, to).filter((item) => item.total >= 3);
  if (overall.rate != null) {
    for (const item of categories) {
      const gap = Math.round(item.rate * 100) - Math.round(overall.rate * 100);
      if (Math.abs(gap) < 20) continue;
      const direction = gap > 0 ? "more often" : "less often";
      insights.push({
        id: `category-${item.category}`,
        text: `${item.category} tasks were completed ${direction} than your other tasks in this period (${Math.round(item.rate * 100)}% of ${item.total}, against ${Math.round(overall.rate * 100)}% overall). This is a pattern in your log, not evidence that the category caused it.`,
      });
      break;
    }
  }

  const morning = relevant.filter((task) => minutesFromTime(task.time) < 12 * 60);
  const evening = relevant.filter((task) => minutesFromTime(task.time) >= 12 * 60);
  if (morning.length >= 3 && evening.length >= 3) {
    const morningRate = morning.filter((task) => task.status === "completed").length / morning.length;
    const eveningRate = evening.filter((task) => task.status === "completed").length / evening.length;
    const gap = Math.round(morningRate * 100) - Math.round(eveningRate * 100);
    if (Math.abs(gap) >= 25) {
      const better = gap > 0 ? "before noon" : "after noon";
      insights.push({
        id: "time-of-day",
        text: `Tasks scheduled ${better} were completed more often (${Math.abs(gap)} point difference). Timing can be a useful signal. It does not show that the clock itself caused the result.`,
      });
    }
  }

  return insights;
}
