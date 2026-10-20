import assert from "node:assert/strict";
import test from "node:test";
import { emptyData } from "../src/lib/defaults";
import { insightsFor, periodStats } from "../src/lib/insights";
import { dueReminders, isQuietTime, planReminders } from "../src/lib/reminders";
import { materializeTasks } from "../src/lib/schedule";
import type { Task } from "../src/lib/types";

function task(partial: Partial<Task> & Pick<Task, "id" | "date">): Task {
  return {
    seriesId: partial.seriesId ?? partial.id,
    title: partial.title ?? "Deep work",
    time: partial.time ?? "09:00",
    durationMinutes: partial.durationMinutes ?? 45,
    category: partial.category ?? "Focus",
    repeat: partial.repeat ?? "none",
    reminderEnabled: partial.reminderEnabled ?? true,
    status: partial.status ?? "scheduled",
    completedAt: null,
    reflection: "",
    createdAt: partial.createdAt ?? "2026-10-01T00:00:00.000Z",
    updatedAt: partial.updatedAt ?? "2026-10-01T00:00:00.000Z",
    ...partial,
  };
}

test("daily tasks materialize once for today and skip occupied dates", () => {
  const anchor = task({ id: "a", seriesId: "series", date: "2026-10-19", repeat: "daily" });
  let ids = 0;
  const created = materializeTasks([anchor], "2026-10-20", "2026-10-20T12:00:00.000Z", () => `new-${++ids}`);
  assert.equal(created.length, 1);
  assert.equal(created[0]?.date, "2026-10-20");
  const again = materializeTasks([anchor, created[0]!], "2026-10-20", "2026-10-20T12:00:00.000Z", () => "nope");
  assert.equal(again.length, 0);
});

test("a cancelled occurrence blocks recreating the same day", () => {
  const cancelled = task({
    id: "a",
    seriesId: "series",
    date: "2026-10-20",
    repeat: "daily",
    status: "cancelled",
  });
  const created = materializeTasks([cancelled], "2026-10-20", "2026-10-20T12:00:00.000Z", () => "new");
  assert.equal(created.length, 0);
});

test("weekdays skip Saturday and weekly follows the anchor weekday", () => {
  const weekday = task({ id: "w", date: "2026-10-16", repeat: "weekdays" });
  const saturday = materializeTasks([weekday], "2026-10-17", "2026-10-17T00:00:00.000Z", () => "sat");
  const monday = materializeTasks([weekday], "2026-10-19", "2026-10-19T00:00:00.000Z", () => "mon");
  assert.equal(saturday.length, 0);
  assert.equal(monday.length, 1);

  const weekly = task({ id: "k", date: "2026-10-13", repeat: "weekly" });
  const nextTuesday = materializeTasks([weekly], "2026-10-20", "2026-10-20T00:00:00.000Z", () => "tue");
  const wednesday = materializeTasks([weekly], "2026-10-21", "2026-10-21T00:00:00.000Z", () => "wed");
  assert.equal(nextTuesday.length, 1);
  assert.equal(wednesday.length, 0);
});

test("quiet hours wrap past midnight and due reminders respect pause", () => {
  assert.equal(isQuietTime(23 * 60, "22:00", "07:00"), true);
  assert.equal(isQuietTime(8 * 60, "22:00", "07:00"), false);
  assert.equal(isQuietTime(6 * 60, "22:00", "07:00"), true);

  const data = emptyData();
  data.settings.pauseAll = true;
  data.tasks.push(task({ id: "t", date: "2026-10-20", time: "09:00" }));
  assert.equal(planReminders(data, { today: "2026-10-20", minutes: 9 * 60 }).length, 0);
});

test("task reminders are due only inside the grace window and once", () => {
  const data = emptyData();
  data.tasks.push(task({ id: "t", date: "2026-10-20", time: "09:00", reminderEnabled: true }));
  const planned = planReminders(data, { today: "2026-10-20", minutes: 9 * 60 + 3 });
  const first = dueReminders(planned, { today: "2026-10-20", minutes: 9 * 60 + 3 }, new Set(), data.settings);
  assert.equal(first.due.length, 1);
  const late = dueReminders(planned, { today: "2026-10-20", minutes: 10 * 60 }, new Set(), data.settings);
  assert.equal(late.due.length, 0);
  const duplicate = dueReminders(planned, { today: "2026-10-20", minutes: 9 * 60 + 3 }, new Set(["task:t:2026-10-20:09:00"]), data.settings);
  assert.equal(duplicate.due.length, 0);
  const quiet = dueReminders(planned, { today: "2026-10-20", minutes: 9 * 60 + 3 }, new Set(), {
    ...data.settings,
    quietHoursEnabled: true,
    quietStart: "08:00",
    quietEnd: "10:00",
  });
  assert.equal(quiet.suppressed.length, 1);
  assert.equal(quiet.due.length, 0);
});

test("insights stay quiet until there is enough recorded variation", () => {
  const tasks = [
    task({ id: "1", date: "2026-10-20", status: "completed", category: "Focus" }),
    task({ id: "2", date: "2026-10-20", status: "skipped", category: "Learning", time: "15:00" }),
  ];
  assert.equal(insightsFor(tasks, "2026-10-20", "2026-10-20").some((item) => item.id.startsWith("category")), false);
  const stats = periodStats(tasks, "2026-10-20", "2026-10-20");
  assert.equal(stats.completed, 1);
  assert.equal(stats.total, 2);
  const cancelled = periodStats([task({ id: "3", date: "2026-10-20", status: "cancelled" })], "2026-10-20", "2026-10-20");
  assert.equal(cancelled.total, 0);
  assert.equal(cancelled.rate, null);
});
