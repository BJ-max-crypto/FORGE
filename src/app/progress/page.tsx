"use client";

import Link from "next/link";
import { useState } from "react";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { EmptyState, Segmented, cn } from "@/components/ui";
import { dayLabels, monthRange, previousMonthRange, previousWeekRange, weekRange } from "@/lib/dates";
import { categoryRates, compareRates, dailyRates, formatPercent, insightsFor, periodStats } from "@/lib/insights";

export default function ProgressPage() {
  const { data, today } = useForge();
  const [view, setView] = useState<"week" | "month">("week");
  const range = !today ? null : view === "week" ? weekRange(today) : monthRange(today);
  const previous = !today ? null : view === "week" ? previousWeekRange(today) : previousMonthRange(today);
  const stats = range ? periodStats(data.tasks, range.from, range.to) : null;
  const prior = previous ? periodStats(data.tasks, previous.from, previous.to) : null;
  const comparison = compareRates(stats?.rate ?? null, prior && prior.total > 0 ? prior.rate : null);
  const days = range ? dailyRates(data.tasks, range.days) : [];
  const labels = range && view === "week" ? dayLabels(range.days) : [];
  const categories = range ? categoryRates(data.tasks, range.from, range.to) : [];
  const insights = range ? insightsFor(data.tasks, range.from, range.to) : [];
  const hasHistory = (stats?.total ?? 0) > 0;

  return (
    <Shell showNav>
      <main className="px-5 pt-[max(20px,env(safe-area-inset-top))] pb-[calc(128px+env(safe-area-inset-bottom))]">
        <h1 className="text-[40px] font-semibold tracking-[-0.045em]">Progress</h1>
        <div className="mt-5">
          <Segmented
            label="Progress range"
            value={view}
            options={[
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
            onChange={setView}
          />
        </div>
        {!hasHistory || !stats ? (
          <div className="mt-8">
            <EmptyState
              title="No record for this period."
              body="Progress is calculated only from tasks you schedule and check in. Nothing here is estimated or filled in for you."
              action={
                <Link href="/tasks/new" className="inline-flex h-11 items-center rounded-[12px] bg-ink px-4 text-[14px] font-medium text-white">
                  Add a task
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <p className="mt-8 text-[56px] font-semibold leading-none tracking-[-0.05em] tabular-nums">
              {formatPercent(stats.rate)}
            </p>
            <p className="mt-2 text-[15px]">
              {stats.completed} of {stats.total} completed
            </p>
            {comparison ? <p className="mt-1 text-[14px] text-muted">{comparison}</p> : (
              <p className="mt-1 text-[14px] text-muted">No earlier period to compare yet.</p>
            )}
            <section className="mt-8" aria-label="Daily consistency">
              <h2 className="text-[13px] font-medium text-muted">Daily consistency</h2>
              <div className="mt-4 flex h-28 items-end gap-1">
                {days.map((day, index) => {
                  const future = today ? day.date > today : false;
                  const height = day.rate == null ? 6 : Math.max(8, Math.round(day.rate * 96));
                  return (
                    <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <div
                        className={cn(
                          "w-full max-w-6 rounded-full",
                          future ? "bg-transparent" : day.rate == null ? "bg-[#ececee]" : day.rate === 1 ? "bg-green" : "bg-ink",
                        )}
                        style={{ height }}
                        title={day.total === 0 ? "No tasks" : `${day.completed} of ${day.total}`}
                      />
                      {view === "week" ? <span className="text-[11px] text-muted">{labels[index]}</span> : null}
                    </div>
                  );
                })}
              </div>
              {view === "month" ? (
                <p className="mt-2 text-[12px] text-muted">Each bar is one day. Empty days had no scheduled tasks.</p>
              ) : null}
            </section>
            <section className="mt-8" aria-label="Categories">
              <h2 className="text-[13px] font-medium text-muted">By category</h2>
              <ul className="mt-3 divide-y divide-line">
                {categories.map((item) => (
                  <li key={item.category} className="flex items-center justify-between py-3">
                    <span>
                      <span className="block text-[15px]">{item.category}</span>
                      <span className="text-[13px] text-muted">
                        {item.completed} of {item.total}
                      </span>
                    </span>
                    <span className="text-[15px] tabular-nums">{formatPercent(item.rate)}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="mt-6" aria-label="Insights">
              <h2 className="text-[13px] font-medium text-muted">From your log</h2>
              {insights.length === 0 ? (
                <p className="mt-3 text-[14px] leading-6 text-muted">
                  Not enough variation yet to describe a pattern. A handful of check-ins will make this useful.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {insights.map((insight) => (
                    <li key={insight.id} className="text-[14px] leading-6">
                      {insight.text}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
        <Link href="/review/weekly" className="mt-8 flex items-center justify-between py-3 text-[15px] font-medium">
          Weekly review
          <span className="font-normal text-muted">Open</span>
        </Link>
      </main>
    </Shell>
  );
}
