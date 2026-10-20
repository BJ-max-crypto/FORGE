"use client";

import { useState } from "react";
import { CATEGORIES, type Category, type RepeatRule, type TaskDraft } from "@/lib/types";
import { hasErrors, validateTaskDraft } from "@/lib/validation";
import { Button, Chip, Field, Segmented, Switch, TextInput } from "@/components/ui";

const REPEAT_OPTIONS: { value: RepeatRule; label: string }[] = [
  { value: "none", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly" },
];

const DURATION_PRESETS = [15, 25, 45, 60, 90];

export function TaskForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: TaskDraft;
  submitLabel: string;
  onSubmit: (draft: TaskDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<TaskDraft>(initial);
  const [customDuration, setCustomDuration] = useState(
    DURATION_PRESETS.includes(initial.durationMinutes) ? "" : String(initial.durationMinutes),
  );
  const [errors, setErrors] = useState(validateTaskDraft(initial));
  const [submitted, setSubmitted] = useState(false);

  function update(patch: Partial<TaskDraft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (submitted) setErrors(validateTaskDraft(next));
  }

  return (
    <form
      className="flex flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        const next = { ...draft, title: draft.title.trim() };
        const nextErrors = validateTaskDraft(next);
        setErrors(nextErrors);
        setSubmitted(true);
        if (hasErrors(nextErrors)) return;
        onSubmit(next);
      }}
    >
      <div className="space-y-5 px-5 pb-6">
        <Field label="Task" error={submitted ? errors.title : undefined}>
          <TextInput
            value={draft.title}
            onChange={(event) => update({ title: event.target.value })}
            placeholder="What will you do?"
            maxLength={80}
            autoFocus
            aria-invalid={Boolean(submitted && errors.title)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" error={submitted ? errors.date : undefined}>
            <TextInput
              type="date"
              value={draft.date}
              onChange={(event) => update({ date: event.target.value })}
              aria-invalid={Boolean(submitted && errors.date)}
            />
          </Field>
          <Field label="Starts" error={submitted ? errors.time : undefined}>
            <TextInput
              type="time"
              value={draft.time}
              onChange={(event) => update({ time: event.target.value })}
              aria-invalid={Boolean(submitted && errors.time)}
            />
          </Field>
        </div>
        <Field
          label="Duration"
          error={submitted ? errors.duration : undefined}
          hint="Between 5 and 240 minutes."
        >
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS.map((minutes) => (
              <Chip
                key={minutes}
                selected={draft.durationMinutes === minutes && customDuration === ""}
                onClick={() => {
                  setCustomDuration("");
                  update({ durationMinutes: minutes });
                }}
              >
                {minutes} min
              </Chip>
            ))}
          </div>
          <TextInput
            className="mt-2"
            inputMode="numeric"
            placeholder="Custom minutes"
            value={customDuration}
            onChange={(event) => {
              const value = event.target.value.replace(/[^\d]/g, "").slice(0, 3);
              setCustomDuration(value);
              const parsed = Number(value);
              if (value && Number.isFinite(parsed)) update({ durationMinutes: parsed });
            }}
          />
        </Field>
        <Field label="Repeat">
          <Segmented label="Repeat schedule" value={draft.repeat} options={REPEAT_OPTIONS} onChange={(repeat) => update({ repeat })} />
        </Field>
        <Field label="Category" error={submitted ? errors.category : undefined}>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Chip
                key={category}
                selected={draft.category === category}
                onClick={() => update({ category: category as Category })}
              >
                {category}
              </Chip>
            ))}
          </div>
        </Field>
        <div className="rounded-[18px] bg-surface px-4">
          <Switch
            checked={draft.reminderEnabled}
            label="Reminder"
            description="Notify when this task starts, if reminders are allowed."
            onChange={(reminderEnabled) => update({ reminderEnabled })}
          />
        </div>
      </div>
      <div className="sticky bottom-0 border-t border-line bg-white px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <Button type="submit">{submitLabel}</Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
