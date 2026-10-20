"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { Button, Field, TextArea, TopBar, cn } from "@/components/ui";
import { MOODS } from "@/lib/defaults";
import { formatLongDate, todayISO } from "@/lib/dates";
import { periodStats } from "@/lib/insights";
import type { DailyReview } from "@/lib/types";

export default function DailyReviewPage() {
  const { data, today, saveDailyReview } = useForge();
  const router = useRouter();
  const day = today || todayISO();
  const existing = data.reviews.find((review) => review.date === day);
  const stats = periodStats(data.tasks, day, day);
  const [mood, setMood] = useState<DailyReview["mood"]>(existing?.mood ?? 3);
  const [obstacles, setObstacles] = useState(existing?.obstacles ?? "");
  const [tomorrow, setTomorrow] = useState(existing?.tomorrowAdjustment ?? "");
  const [error, setError] = useState("");

  return (
    <Shell>
      <TopBar title="Daily review" back="/today" />
      <main className="px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        <p className="text-[13px] text-muted">{formatLongDate(day)}</p>
        <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em]">
          {stats.total === 0 ? "No tasks were scheduled." : `${stats.completed} of ${stats.total} completed`}
        </h1>
        {stats.partial > 0 ? (
          <p className="mt-2 text-[14px] text-muted">{stats.partial} partly completed.</p>
        ) : null}
        <fieldset className="mt-8">
          <legend className="text-[13px] font-medium">Mood</legend>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {MOODS.map((item) => {
              const selected = mood === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setMood(item.value)}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center rounded-[14px] text-[12px]",
                    selected ? "bg-ink text-white" : "bg-surface",
                  )}
                >
                  <span className="text-[16px] font-medium">{item.value}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="mt-6 space-y-5">
          <Field label="What got in the way?" hint="Optional.">
            <TextArea value={obstacles} onChange={(event) => setObstacles(event.target.value)} maxLength={500} />
          </Field>
          <Field label="Adjustment for tomorrow" hint="Optional.">
            <TextArea value={tomorrow} onChange={(event) => setTomorrow(event.target.value)} maxLength={500} />
          </Field>
        </div>
        {error ? <p className="mt-3 text-[14px] text-danger">{error}</p> : null}
        <div className="mt-6">
          <Button
            onClick={() => {
              if (!mood) {
                setError("Choose a mood.");
                return;
              }
              saveDailyReview({
                date: day,
                mood,
                obstacles,
                tomorrowAdjustment: tomorrow,
              });
              router.push("/today");
            }}
          >
            {existing ? "Update review" : "Finish review"}
          </Button>
        </div>
      </main>
    </Shell>
  );
}
