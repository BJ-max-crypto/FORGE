"use client";

import Link from "next/link";
import { useState } from "react";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { Chip, EmptyState, ProgressBar } from "@/components/ui";
import { EXPERIMENT_PRESETS } from "@/lib/defaults";
import { todayISO } from "@/lib/dates";
import { EXPERIMENT_CATEGORIES, type ExperimentCategory } from "@/lib/types";

export default function ExperimentsPage() {
  const { data, today } = useForge();
  const [filter, setFilter] = useState<ExperimentCategory | "All">("All");
  const active = data.experiments.filter((experiment) => experiment.status === "active");
  const featured = active[0];
  const day = today || todayISO();
  const presets = EXPERIMENT_PRESETS.filter((preset) => filter === "All" || preset.category === filter);

  let progress: number | null = null;
  let dayCount = 0;
  if (featured?.startDate && featured.endDate) {
    const elapsed = Math.max(0, Math.round((Date.parse(day) - Date.parse(featured.startDate)) / 86_400_000) + 1);
    dayCount = Math.min(featured.durationDays, elapsed);
    progress = featured.durationDays === 0 ? null : dayCount / featured.durationDays;
  }

  return (
    <Shell showNav>
      <main className="px-5 pt-[max(20px,env(safe-area-inset-top))] pb-[calc(128px+env(safe-area-inset-bottom))]">
        <div className="flex items-end justify-between gap-3">
          <h1 className="text-[40px] font-semibold tracking-[-0.045em]">Experiments</h1>
        </div>
        <p className="mt-2 text-[14px] leading-6 text-muted">
          A personal test of one routine. The result is a signal from your own ratings, not scientific proof.
        </p>
        {featured ? (
          <Link href={`/experiments/${featured.id}`} className="mt-6 block rounded-[18px] bg-surface p-4">
            <p className="text-[12px] font-medium text-muted">Active</p>
            <p className="mt-1 text-[18px] font-semibold tracking-[-0.02em]">{featured.title}</p>
            <p className="mt-1 text-[13px] text-muted">
              Day {Math.max(dayCount, 1)} of {featured.durationDays} · {featured.category}
            </p>
            <div className="mt-3">
              <ProgressBar value={progress} />
            </div>
          </Link>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="No experiment running."
              body="Pick a preset or write your own. You will rate a baseline first, then log the days you actually run it."
            />
          </div>
        )}
        {active.length > 1 ? (
          <ul className="mt-3 divide-y divide-line">
            {active.slice(1).map((experiment) => (
              <li key={experiment.id}>
                <Link href={`/experiments/${experiment.id}`} className="flex items-center justify-between py-3">
                  <span className="text-[15px]">{experiment.title}</span>
                  <span className="text-[13px] text-muted">Also running</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-[13px] font-medium text-muted">Discover</h2>
          <Link href="/experiments/new" className="text-[14px] font-medium">
            Custom
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip selected={filter === "All"} onClick={() => setFilter("All")}>
            All
          </Chip>
          {EXPERIMENT_CATEGORIES.map((category) => (
            <Chip key={category} selected={filter === category} onClick={() => setFilter(category)}>
              {category}
            </Chip>
          ))}
        </div>
        <ul className="mt-4 space-y-2">
          {presets.map((preset) => (
            <li key={preset.id}>
              <Link href={`/experiments/new?preset=${preset.id}`} className="block rounded-[18px] border border-line px-4 py-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[16px] font-medium">{preset.title}</p>
                  <p className="shrink-0 text-[12px] text-muted">{preset.durationDays} days</p>
                </div>
                <p className="mt-1 text-[13px] text-muted">{preset.category}</p>
                <p className="mt-2 text-[14px] leading-6 text-ink/80">{preset.description}</p>
              </Link>
            </li>
          ))}
        </ul>
        {data.experiments.some((experiment) => experiment.status === "completed") ? (
          <section className="mt-8">
            <h2 className="text-[13px] font-medium text-muted">Finished</h2>
            <ul className="mt-2 divide-y divide-line">
              {data.experiments
                .filter((experiment) => experiment.status === "completed")
                .map((experiment) => (
                  <li key={experiment.id}>
                    <Link href={`/experiments/${experiment.id}/results`} className="flex items-center justify-between py-3">
                      <span className="text-[15px]">{experiment.title}</span>
                      <span className="text-[13px] text-muted">Results</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ) : null}
      </main>
    </Shell>
  );
}
