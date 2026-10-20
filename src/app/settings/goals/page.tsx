"use client";

import { useState } from "react";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { Button, Chip, Field, TextArea, TextInput, TopBar, cn } from "@/components/ui";
import { AREAS } from "@/lib/types";

export default function GoalsPage() {
  const { data, addGoal, updateGoal, deleteGoal, setPrimaryGoal, updateProfile } = useForge();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  return (
    <Shell>
      <TopBar title="Goals" back="/settings" />
      <main className="px-5 pb-16">
        <ul className="space-y-3">
          {data.goals.length === 0 ? <li className="text-[14px] text-muted">No goals yet.</li> : null}
          {data.goals.map((goal) => (
            <li key={goal.id} className="rounded-[18px] bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[16px] font-medium">{goal.title}</p>
                {goal.isPrimary ? <span className="text-[12px] text-muted">Primary</span> : null}
              </div>
              {goal.description ? <p className="mt-1 text-[14px] leading-6 text-muted">{goal.description}</p> : null}
              <div className="mt-3 flex gap-3 text-[14px]">
                {!goal.isPrimary ? (
                  <button type="button" className="font-medium" onClick={() => setPrimaryGoal(goal.id)}>
                    Make primary
                  </button>
                ) : null}
                <button type="button" className="text-danger" onClick={() => deleteGoal(goal.id)}>
                  Remove
                </button>
              </div>
              <label className="mt-3 block text-[13px] text-muted">
                Description
                <textarea
                  value={goal.description}
                  onChange={(event) => updateGoal(goal.id, { description: event.target.value })}
                  className="mt-1 min-h-16 w-full resize-none rounded-[12px] bg-white px-3 py-2 text-[15px] text-ink outline-none"
                />
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-8 space-y-4">
          <Field label="New goal" error={error}>
            <TextInput value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} />
          </Field>
          <Field label="Description" hint="Optional.">
            <TextArea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={240} />
          </Field>
          <Button
            onClick={() => {
              if (!title.trim()) {
                setError("Name the goal.");
                return;
              }
              addGoal(title, description, data.goals.length === 0);
              setTitle("");
              setDescription("");
              setError("");
            }}
          >
            Add goal
          </Button>
        </div>
        <section className="mt-10">
          <h2 className="text-[13px] font-medium text-muted">Areas of development</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {AREAS.map((area) => {
              const selected = data.profile.areas.includes(area);
              return (
                <Chip
                  key={area}
                  selected={selected}
                  onClick={() =>
                    updateProfile({
                      areas: selected
                        ? data.profile.areas.filter((item) => item !== area)
                        : [...data.profile.areas, area],
                    })
                  }
                >
                  <span className={cn(selected && "text-white")}>{area}</span>
                </Chip>
              );
            })}
          </div>
        </section>
      </main>
    </Shell>
  );
}
