"use client";

import { useRouter } from "next/navigation";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { TaskForm } from "@/components/task-form";
import { TopBar } from "@/components/ui";
import { todayISO } from "@/lib/dates";
import type { TaskDraft } from "@/lib/types";

export default function NewTaskPage() {
  const { addTask, today } = useForge();
  const router = useRouter();
  const initial: TaskDraft = {
    title: "",
    date: today || todayISO(),
    time: "09:00",
    durationMinutes: 45,
    repeat: "none",
    category: "Focus",
    reminderEnabled: true,
  };

  return (
    <Shell>
      <TopBar title="New task" back="/today" />
      <TaskForm
        initial={initial}
        submitLabel="Save task"
        onCancel={() => router.push("/today")}
        onSubmit={(draft) => {
          addTask(draft);
          router.push("/today");
        }}
      />
    </Shell>
  );
}
