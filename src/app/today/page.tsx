"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { TaskTimeline } from "@/components/task-timeline";
import { EmptyState, ProgressBar } from "@/components/ui";
import { formatShortDate, greeting } from "@/lib/dates";
import { formatPercent, periodStats } from "@/lib/insights";
import { nextTask, tasksOnDate } from "@/lib/schedule";

export default function TodayPage() {
  const { data, today } = useForge();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const tasks = today ? tasksOnDate(data.tasks, today) : [];
  const stats = today ? periodStats(data.tasks, today, today) : null;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const highlighted = today ? nextTask(data.tasks, today, minutes) : null;
  const reviewed = data.reviews.some((review) => review.date === today);
  const name = data.profile.displayName.trim();

  return (
    <Shell showNav showFab>
      <main className="px-5 pt-[max(20px,env(safe-area-inset-top))] pb-[calc(128px+env(safe-area-inset-bottom))]">
        <p className="text-[13px] text-muted">
          {greeting(now)}
          {name ? `, ${name}` : ""} · {today ? formatShortDate(today) : ""}
        </p>
        <h1 className="mt-1 text-[40px] font-semibold tracking-[-0.045em]">Today.</h1>
        <section className="mt-6" aria-label="Daily completion">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[15px] font-medium">
              {stats ? `${stats.completed} of ${stats.total} completed` : "No tasks yet"}
            </p>
            <p className="text-[13px] tabular-nums text-muted">{formatPercent(stats?.rate ?? null)}</p>
          </div>
          <div className="mt-2.5">
            <ProgressBar value={stats?.rate ?? 0} tone={stats?.rate === 1 ? "green" : "ink"} />
          </div>
          {stats && stats.partial > 0 ? (
            <p className="mt-2 text-[13px] text-muted">
              {stats.partial} partly completed. Those are not counted as finished.
            </p>
          ) : null}
        </section>
        <section className="mt-8" aria-label="Schedule">
          {tasks.length === 0 ? (
            <EmptyState
              title="Nothing scheduled."
              body="Add one task with a time. It will show up here in order, and your progress will start from what you actually record."
              action={
                <Link
                  href="/tasks/new"
                  className="inline-flex h-11 items-center rounded-[12px] bg-ink px-4 text-[14px] font-medium text-white"
                >
                  Add a task
                </Link>
              }
            />
          ) : (
            <TaskTimeline tasks={tasks} nowMinutes={minutes} highlightId={highlighted?.id ?? null} />
          )}
        </section>
        <Link
          href="/review/daily"
          className="mt-6 flex items-center justify-between rounded-[16px] px-1 py-3 text-[15px]"
        >
          <span className="font-medium">Daily review</span>
          <span className="text-muted">{reviewed ? "Saved" : "Open"}</span>
        </Link>
      </main>
    </Shell>
  );
}
