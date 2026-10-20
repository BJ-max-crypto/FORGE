"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { Button, Field, TextArea, TopBar } from "@/components/ui";
import { formatShortDate, todayISO, weekRange } from "@/lib/dates";
import { formatPercent, insightsFor, periodStats } from "@/lib/insights";

export default function WeeklyReviewPage() {
  const { data, today, saveWeeklyReview } = useForge();
  const router = useRouter();
  const day = today || todayISO();
  const range = weekRange(day);
  const existing = data.weeklyReviews.find((review) => review.weekStart === range.from);
  const stats = periodStats(data.tasks, range.from, range.to);
  const insights = insightsFor(data.tasks, range.from, range.to);
  const [wentWell, setWentWell] = useState(existing?.wentWell ?? "");
  const [difficult, setDifficult] = useState(existing?.difficult ?? "");
  const [patterns, setPatterns] = useState(existing?.patterns ?? "");
  const [nextFocus, setNextFocus] = useState(existing?.nextFocus ?? "");

  return (
    <Shell>
      <TopBar title="Weekly review" back="/progress" />
      <main className="px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        <p className="text-[13px] text-muted">
          {formatShortDate(range.from)} – {formatShortDate(range.to)}
        </p>
        <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em]">
          {stats.total === 0 ? "No tasks this week." : `${formatPercent(stats.rate)} completed`}
        </h1>
        {stats.total > 0 ? (
          <p className="mt-2 text-[14px] text-muted">
            {stats.completed} of {stats.total} tasks marked completed.
          </p>
        ) : null}
        <section className="mt-6">
          <h2 className="text-[13px] font-medium text-muted">From your log</h2>
          {insights.length === 0 ? (
            <p className="mt-2 text-[14px] leading-6 text-muted">
              There is not enough recorded variation to describe a pattern this week.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {insights.map((insight) => (
                <li key={insight.id} className="text-[14px] leading-6">
                  {insight.text}
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="mt-6 space-y-5">
          <Field label="What went well">
            <TextArea value={wentWell} onChange={(event) => setWentWell(event.target.value)} maxLength={500} />
          </Field>
          <Field label="What was difficult">
            <TextArea value={difficult} onChange={(event) => setDifficult(event.target.value)} maxLength={500} />
          </Field>
          <Field label="Patterns you noticed" hint="The log above is descriptive. Your note can say what you think it means.">
            <TextArea value={patterns} onChange={(event) => setPatterns(event.target.value)} maxLength={500} />
          </Field>
          <Field label="Focus for the coming week">
            <TextArea value={nextFocus} onChange={(event) => setNextFocus(event.target.value)} maxLength={500} />
          </Field>
        </div>
        <div className="mt-6">
          <Button
            onClick={() => {
              saveWeeklyReview({
                weekStart: range.from,
                wentWell: wentWell.trim(),
                difficult: difficult.trim(),
                patterns: patterns.trim(),
                nextFocus: nextFocus.trim(),
              });
              router.push("/progress");
            }}
          >
            {existing ? "Update review" : "Save review"}
          </Button>
        </div>
      </main>
    </Shell>
  );
}
