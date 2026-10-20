"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { Button, Chip, Field, TextInput } from "@/components/ui";
import { AREAS, CATEGORIES, type Category, type TaskDraft } from "@/lib/types";
import { todayISO } from "@/lib/dates";

const STEPS = ["Welcome", "Name", "Goal", "Areas", "Task", "Reminders"] as const;

export default function OnboardingPage() {
  const { completeOnboarding, data, mode } = useForge();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(data.profile.displayName);
  const [goal, setGoal] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [category, setCategory] = useState<Category>("Focus");
  const [error, setError] = useState("");
  const [permissionNote, setPermissionNote] = useState("");

  function next() {
    setError("");
    if (step === 1 && name.trim().length === 0) {
      setError("Add the name you want to see in the app.");
      return;
    }
    if (step === 2 && goal.trim().length === 0) {
      setError("Name one thing you are working toward.");
      return;
    }
    if (step === 3 && areas.length === 0) {
      setError("Choose at least one area.");
      return;
    }
    if (step === 4 && title.trim().length === 0) {
      setError("Add one task, even a small one.");
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function finish(taskReminder: boolean) {
    const task: TaskDraft = {
      title: title.trim(),
      date: todayISO(),
      time,
      durationMinutes: 45,
      repeat: "none",
      category,
      reminderEnabled: taskReminder,
    };
    completeOnboarding({ name, goal, areas, task });
    router.replace("/today");
  }

  async function enableReminders() {
    if (typeof Notification === "undefined") {
      setPermissionNote("This browser does not support notifications. You can still use in-app reminders while FORGE is open.");
      finish(true);
      return;
    }
    const result = await Notification.requestPermission();
    if (result === "denied") {
      setPermissionNote("Notifications are blocked. FORGE will keep reminders inside the app while it is open. Continue without system notifications.");
      return;
    }
    if (result === "granted" && "serviceWorker" in navigator) {
      await navigator.serviceWorker.register("/sw.js");
    }
    finish(result === "granted");
  }

  if (mode === "demo" || mode === "supabase") {
    return (
      <Shell>
        <div className="flex min-h-dvh flex-col px-5 pt-[max(28px,env(safe-area-inset-top))] pb-[max(16px,env(safe-area-inset-bottom))]">
          <div className="flex gap-1.5" aria-hidden="true">
            {STEPS.map((label, index) => (
              <span key={label} className={`h-1 flex-1 rounded-full ${index <= step ? "bg-ink" : "bg-[#ececee]"}`} />
            ))}
          </div>
          <div className="flex-1 pt-10">
            {step === 0 ? (
              <>
                <p className="text-[13px] font-medium tracking-[0.16em]">FORGE</p>
                <h1 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-[-0.045em]">
                  Decide what today is for.
                </h1>
                <p className="mt-4 max-w-[32ch] text-[16px] leading-6 text-muted">
                  Plan a few tasks, do them, and keep a private record of what actually helps.
                </p>
              </>
            ) : null}
            {step === 1 ? (
              <>
                <h1 className="text-[34px] font-semibold tracking-[-0.04em]">What should we call you?</h1>
                <div className="mt-8">
                  <Field label="Name">
                    <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={40} autoFocus />
                  </Field>
                </div>
              </>
            ) : null}
            {step === 2 ? (
              <>
                <h1 className="text-[34px] font-semibold tracking-[-0.04em]">What are you working toward?</h1>
                <p className="mt-3 text-[15px] leading-6 text-muted">One primary goal is enough. You can add others later.</p>
                <div className="mt-8">
                  <Field label="Primary goal">
                    <TextInput value={goal} onChange={(event) => setGoal(event.target.value)} maxLength={80} autoFocus placeholder="Finish the essay draft" />
                  </Field>
                </div>
              </>
            ) : null}
            {step === 3 ? (
              <>
                <h1 className="text-[34px] font-semibold tracking-[-0.04em]">Where do you want more consistency?</h1>
                <div className="mt-8 flex flex-wrap gap-2">
                  {AREAS.map((area) => (
                    <Chip
                      key={area}
                      selected={areas.includes(area)}
                      onClick={() =>
                        setAreas((current) =>
                          current.includes(area) ? current.filter((item) => item !== area) : [...current, area],
                        )
                      }
                    >
                      {area}
                    </Chip>
                  ))}
                </div>
              </>
            ) : null}
            {step === 4 ? (
              <>
                <h1 className="text-[34px] font-semibold tracking-[-0.04em]">Put one thing on today.</h1>
                <div className="mt-8 space-y-5">
                  <Field label="Task">
                    <TextInput value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} autoFocus />
                  </Field>
                  <Field label="Starts">
                    <TextInput type="time" value={time} onChange={(event) => setTime(event.target.value)} />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((item) => (
                      <Chip key={item} selected={category === item} onClick={() => setCategory(item)}>
                        {item}
                      </Chip>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
            {step === 5 ? (
              <>
                <h1 className="text-[34px] font-semibold tracking-[-0.04em]">Reminders, if you want them.</h1>
                <p className="mt-3 text-[15px] leading-6 text-muted">
                  A website cannot guarantee a notification once the tab is closed. While FORGE is open, reminders appear in the app. System notifications work only when this browser allows them, and most reliably if you install FORGE.
                </p>
                {permissionNote ? <p className="mt-4 text-[14px] leading-6">{permissionNote}</p> : null}
              </>
            ) : null}
            {error ? <p className="mt-4 text-[14px] text-danger">{error}</p> : null}
          </div>
          {step < 5 ? (
            <div className="pt-4">
              <Button onClick={next}>{step === 0 ? "Begin" : "Continue"}</Button>
              {step > 0 ? (
                <Button variant="ghost" onClick={() => setStep((current) => current - 1)}>
                  Back
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="pt-4">
              <Button onClick={() => void enableReminders()}>Allow reminders</Button>
              <Button variant="ghost" onClick={() => finish(false)}>
                Not now
              </Button>
            </div>
          )}
        </div>
      </Shell>
    );
  }

  return <Shell>{null}</Shell>;
}
