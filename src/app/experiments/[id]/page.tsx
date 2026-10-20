"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { Button, Field, ProgressBar, TextInput, TopBar } from "@/components/ui";
import { formatLongDate, todayISO } from "@/lib/dates";

export default function ExperimentDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, today, logMeasurement } = useForge();
  const experiment = data.experiments.find((item) => item.id === params.id);
  const day = today || todayISO();
  const existing = experiment?.measurements.find((item) => item.date === day);
  const [value, setValue] = useState(existing?.value ?? 5);
  const [note, setNote] = useState(existing?.note ?? "");
  const [saved, setSaved] = useState(false);

  if (!experiment) {
    return (
      <Shell>
        <TopBar title="Experiment" back="/experiments" />
        <p className="px-5 pt-8 text-[15px] text-muted">This experiment is not available.</p>
      </Shell>
    );
  }

  const elapsed = experiment.startDate
    ? Math.min(
        experiment.durationDays,
        Math.max(1, Math.round((Date.parse(day) - Date.parse(experiment.startDate)) / 86_400_000) + 1),
      )
    : 0;

  return (
    <Shell>
      <TopBar title="Experiment" back="/experiments" />
      <main className="px-5 pb-16">
        <p className="text-[13px] text-muted">{experiment.category}</p>
        <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">{experiment.title}</h1>
        <p className="mt-3 text-[15px] leading-6">{experiment.description}</p>
        <p className="mt-4 text-[14px] leading-6 text-muted">Testing: {experiment.hypothesis}</p>
        <div className="mt-5">
          <ProgressBar value={experiment.durationDays ? elapsed / experiment.durationDays : null} />
          <p className="mt-2 text-[13px] text-muted">
            Day {elapsed} of {experiment.durationDays}
            {experiment.endDate ? ` · through ${formatLongDate(experiment.endDate)}` : ""}
          </p>
        </div>
        <p className="mt-5 text-[14px] text-muted">
          Baseline {experiment.baseline ?? "—"}
          {experiment.baselineNote ? ` · ${experiment.baselineNote}` : ""}
        </p>
        {experiment.status === "active" ? (
          <section className="mt-8">
            <h2 className="text-[16px] font-medium">Today&apos;s rating</h2>
            <p className="mt-1 text-[14px] leading-6 text-muted">{experiment.measurePrompt}</p>
            <div className="mt-4 flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={10}
                value={value}
                aria-label="Today's rating"
                onChange={(event) => setValue(Number(event.target.value))}
                className="w-full accent-ink"
              />
              <span className="w-8 text-right tabular-nums">{value}</span>
            </div>
            <div className="mt-3">
              <Field label="Note" hint="Optional.">
                <TextInput value={note} onChange={(event) => setNote(event.target.value)} maxLength={160} />
              </Field>
            </div>
            <div className="mt-4">
              <Button
                onClick={() => {
                  logMeasurement(experiment.id, value, note);
                  setSaved(true);
                }}
              >
                {existing ? "Update rating" : "Save rating"}
              </Button>
            </div>
            {saved ? <p className="mt-2 text-[13px] text-green">Saved for today.</p> : null}
          </section>
        ) : null}
        <Link
          href={`/experiments/${experiment.id}/results`}
          className="mt-6 flex h-[52px] items-center justify-center rounded-[14px] bg-surface text-[16px] font-medium"
        >
          View results
        </Link>
      </main>
    </Shell>
  );
}
