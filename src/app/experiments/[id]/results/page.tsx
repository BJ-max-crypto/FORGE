"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { Button, Field, TextArea, TopBar } from "@/components/ui";

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default function ExperimentResultsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, setExperimentReflection, decideExperiment } = useForge();
  const experiment = data.experiments.find((item) => item.id === params.id);
  const [reflection, setReflection] = useState(experiment?.reflection ?? "");

  if (!experiment) {
    return (
      <Shell>
        <TopBar title="Results" back="/experiments" />
        <p className="px-5 pt-8 text-[15px] text-muted">This experiment is not available.</p>
      </Shell>
    );
  }

  const during = average(experiment.measurements.map((item) => item.value));
  const baseline = experiment.baseline;
  const delta =
    baseline != null && during != null ? Math.round((during - baseline) * 10) / 10 : null;

  return (
    <Shell>
      <TopBar title="Results" back={`/experiments/${experiment.id}`} />
      <main className="px-5 pb-[max(24px,env(safe-area-inset-bottom))]">
        <h1 className="text-[30px] font-semibold tracking-[-0.04em]">{experiment.title}</h1>
        <p className="mt-3 text-[14px] leading-6 text-muted">
          These numbers compare your baseline rating with the ratings you logged. They are a personal signal, not proof that the routine caused the change.
        </p>
        <div className="mt-6 space-y-4">
          <Comparison label="Baseline" value={baseline} />
          <Comparison label="During experiment" value={during} />
        </div>
        <p className="mt-4 text-[14px] leading-6">
          {delta == null
            ? "A comparison needs both a baseline and at least one daily rating."
            : delta === 0
              ? "The average during the experiment matched your baseline."
              : delta > 0
                ? `${delta} points higher than your baseline, on this self-rating.`
                : `${Math.abs(delta)} points lower than your baseline, on this self-rating.`}
        </p>
        <p className="mt-2 text-[13px] text-muted">{experiment.measurements.length} daily ratings logged.</p>
        <div className="mt-6">
          <Field label="Reflection">
            <TextArea value={reflection} onChange={(event) => setReflection(event.target.value)} maxLength={600} />
          </Field>
          <button
            type="button"
            className="mt-2 text-[14px] font-medium"
            onClick={() => setExperimentReflection(experiment.id, reflection.trim())}
          >
            Save note
          </button>
        </div>
        <div className="mt-8 space-y-2">
          <Button
            onClick={() => {
              setExperimentReflection(experiment.id, reflection.trim());
              decideExperiment(experiment.id, "keep");
              router.push("/experiments");
            }}
          >
            Keep this routine
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setExperimentReflection(experiment.id, reflection.trim());
              decideExperiment(experiment.id, "retest");
              const query = new URLSearchParams({
                title: experiment.title,
                hypothesis: experiment.hypothesis,
                category: experiment.category,
              });
              router.push(`/experiments/new?${query.toString()}`);
            }}
          >
            Test again
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setExperimentReflection(experiment.id, reflection.trim());
              decideExperiment(experiment.id, "try_else");
              router.push("/experiments");
            }}
          >
            Try something else
          </Button>
        </div>
      </main>
    </Shell>
  );
}

function Comparison({ label, value }: { label: string; value: number | null }) {
  const width = value == null ? 0 : (value / 10) * 100;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[14px]">{label}</span>
        <span className="text-[14px] tabular-nums text-muted">{value == null ? "—" : value.toFixed(1)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#ececee]">
        <div className="h-full rounded-full bg-ink" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
