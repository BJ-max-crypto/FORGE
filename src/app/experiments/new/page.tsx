"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { BootScreen, Button, Chip, Field, Switch, TextArea, TextInput, TopBar } from "@/components/ui";
import { EXPERIMENT_PRESETS } from "@/lib/defaults";
import { EXPERIMENT_CATEGORIES, type ExperimentCategory } from "@/lib/types";

const DURATIONS = [7, 10, 14, 21, 30];

function SetupForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { startExperiment } = useForge();
  const preset = useMemo(
    () => EXPERIMENT_PRESETS.find((item) => item.id === params.get("preset")),
    [params],
  );
  const categoryParam = params.get("category");
  const initialCategory: ExperimentCategory =
    categoryParam === "Focus" || categoryParam === "Learning" || categoryParam === "Energy"
      ? categoryParam
      : (preset?.category ?? "Focus");
  const [title, setTitle] = useState(params.get("title") || preset?.title || "");
  const [description, setDescription] = useState(preset?.description ?? "");
  const [hypothesis, setHypothesis] = useState(params.get("hypothesis") || preset?.hypothesis || "");
  const [measurePrompt, setMeasurePrompt] = useState(preset?.measurePrompt ?? "How did this go today, from 1 to 10?");
  const [category, setCategory] = useState<ExperimentCategory>(initialCategory);
  const [durationDays, setDurationDays] = useState(preset?.durationDays ?? 14);
  const [baseline, setBaseline] = useState(5);
  const [baselineNote, setBaselineNote] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [error, setError] = useState("");

  return (
    <Shell>
      <TopBar title="Experiment" back="/experiments" />
      <main className="px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em]">{preset ? preset.title : "Custom experiment"}</h1>
        <p className="mt-2 text-[14px] leading-6 text-muted">
          You are testing one change against your own baseline. Keep the claim small.
        </p>
        <div className="mt-6 space-y-5">
          {!preset ? (
            <Field label="Name" error={error && !title.trim() ? "Name the experiment." : undefined}>
              <TextInput value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} />
            </Field>
          ) : null}
          <Field label="What you will do">
            <TextArea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={400} />
          </Field>
          <Field label="What is being tested">
            <TextArea value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} maxLength={300} />
          </Field>
          <Field label="Daily question" hint="You will answer this from 1 to 10.">
            <TextInput value={measurePrompt} onChange={(event) => setMeasurePrompt(event.target.value)} maxLength={160} />
          </Field>
          <Field label="Category">
            <div className="flex flex-wrap gap-2">
              {EXPERIMENT_CATEGORIES.map((item) => (
                <Chip key={item} selected={category === item} onClick={() => setCategory(item)}>
                  {item}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Duration">
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((days) => (
                <Chip key={days} selected={durationDays === days} onClick={() => setDurationDays(days)}>
                  {days} days
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Baseline" hint="Rate the last few days on the same scale you will use during the experiment.">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={10}
                value={baseline}
                aria-label="Baseline rating"
                onChange={(event) => setBaseline(Number(event.target.value))}
                className="w-full accent-ink"
              />
              <span className="w-8 text-right text-[16px] tabular-nums">{baseline}</span>
            </div>
          </Field>
          <Field label="Baseline note" hint="Optional.">
            <TextInput value={baselineNote} onChange={(event) => setBaselineNote(event.target.value)} maxLength={160} />
          </Field>
          <div className="rounded-[18px] bg-surface px-4">
            <Switch
              checked={reminderEnabled}
              label="Daily reminder"
              description="Around 8:00 PM, while the app is open, if you have not logged a rating."
              onChange={setReminderEnabled}
            />
          </div>
        </div>
        {error ? <p className="mt-4 text-[14px] text-danger">{error}</p> : null}
        <div className="mt-6">
          <Button
            onClick={() => {
              if (!title.trim() || !hypothesis.trim()) {
                setError("Add a name and what you are testing.");
                return;
              }
              const id = startExperiment({
                title,
                description,
                hypothesis,
                measurePrompt,
                category,
                durationDays,
                baseline,
                baselineNote,
                reminderEnabled,
              });
              router.push(`/experiments/${id}`);
            }}
          >
            Start experiment
          </Button>
          <Button variant="ghost" onClick={() => router.push("/experiments")}>
            Cancel
          </Button>
        </div>
      </main>
    </Shell>
  );
}

export default function NewExperimentPage() {
  return (
    <Suspense fallback={<BootScreen />}>
      <SetupForm />
    </Suspense>
  );
}
