"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { BootScreen, Button, Field, TextArea, TextInput, TopBar, cn } from "@/components/ui";
import { todayISO } from "@/lib/dates";

const OUTCOMES = [
  { id: "completed", label: "Completed" },
  { id: "partial", label: "Partly completed" },
  { id: "skipped", label: "Didn't do it" },
  { id: "reschedule", label: "Reschedule" },
] as const;

type Outcome = (typeof OUTCOMES)[number]["id"];

function CheckInForm() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { data, checkIn, rescheduleTask, today } = useForge();
  const task = data.tasks.find((item) => item.id === params.id && item.status !== "cancelled");
  const initial = search.get("intent") === "reschedule" ? "reschedule" : null;
  const [outcome, setOutcome] = useState<Outcome | null>(initial);
  const [reflection, setReflection] = useState(task?.reflection ?? "");
  const [date, setDate] = useState(task?.date || today || todayISO());
  const [time, setTime] = useState(task?.time ?? "09:00");
  const [error, setError] = useState("");

  if (!task) {
    return (
      <Shell>
        <TopBar title="Check in" back="/today" />
        <p className="px-5 pt-8 text-[15px] text-muted">This task is no longer available.</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <TopBar title="Check in" back={`/tasks/${task.id}`} />
      <main className="px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em]">{task.title}</h1>
        <p className="mt-2 text-[14px] text-muted">How did this one go?</p>
        <div className="mt-6 space-y-2" role="radiogroup" aria-label="Outcome">
          {OUTCOMES.map((item) => {
            const selected = outcome === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setOutcome(item.id)}
                className={cn(
                  "flex h-[52px] w-full items-center rounded-[14px] px-4 text-left text-[16px]",
                  selected ? "bg-ink text-white" : "bg-surface",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        {outcome === "reschedule" ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Field label="New date">
              <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </Field>
            <Field label="New time">
              <TextInput type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </Field>
          </div>
        ) : null}
        <div className="mt-5">
          <Field label="Reflection" hint="Optional.">
            <TextArea value={reflection} onChange={(event) => setReflection(event.target.value)} maxLength={500} />
          </Field>
        </div>
        {error ? <p className="mt-3 text-[14px] text-danger">{error}</p> : null}
        <div className="mt-6">
          <Button
            onClick={() => {
              if (!outcome) {
                setError("Choose an outcome.");
                return;
              }
              if (outcome === "reschedule") {
                if (!date || !time) {
                  setError("Choose a new date and time.");
                  return;
                }
                rescheduleTask(task.id, date, time, reflection);
              } else {
                checkIn(task.id, { status: outcome, reflection });
              }
              router.push("/today");
            }}
          >
            Save
          </Button>
        </div>
      </main>
    </Shell>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<BootScreen />}>
      <CheckInForm />
    </Suspense>
  );
}
