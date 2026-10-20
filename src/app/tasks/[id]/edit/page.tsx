"use client";

import { useParams, useRouter } from "next/navigation";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { TaskForm } from "@/components/task-form";
import { TopBar } from "@/components/ui";
import type { TaskDraft } from "@/lib/types";

export default function EditTaskPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, updateTask } = useForge();
  const task = data.tasks.find((item) => item.id === params.id && item.status !== "cancelled");

  if (!task) {
    return (
      <Shell>
        <TopBar title="Edit task" back="/today" />
        <p className="px-5 pt-8 text-[15px] text-muted">This task is no longer available.</p>
      </Shell>
    );
  }

  const initial: TaskDraft = {
    title: task.title,
    date: task.date,
    time: task.time,
    durationMinutes: task.durationMinutes,
    repeat: task.repeat,
    category: task.category,
    reminderEnabled: task.reminderEnabled,
  };

  return (
    <Shell>
      <TopBar title="Edit task" back={`/tasks/${task.id}`} />
      <TaskForm
        initial={initial}
        submitLabel="Save changes"
        onCancel={() => router.push(`/tasks/${task.id}`)}
        onSubmit={(draft) => {
          updateTask(task.id, {
            title: draft.title.trim(),
            date: draft.date,
            time: draft.time,
            durationMinutes: draft.durationMinutes,
            repeat: draft.repeat,
            category: draft.category,
            reminderEnabled: draft.reminderEnabled,
          });
          router.push(`/tasks/${task.id}`);
        }}
      />
    </Shell>
  );
}
