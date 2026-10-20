"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { Button, Dialog, TopBar } from "@/components/ui";
import { formatDuration, formatLongDate, formatTime } from "@/lib/dates";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, deleteTask } = useForge();
  const [confirming, setConfirming] = useState(false);
  const task = data.tasks.find((item) => item.id === params.id && item.status !== "cancelled");

  if (!task) {
    return (
      <Shell>
        <TopBar title="Task" back="/today" />
        <div className="px-5 pt-8">
          <p className="text-[16px] font-medium">This task is no longer available.</p>
          <p className="mt-2 text-[14px] leading-6 text-muted">It may have been deleted.</p>
        </div>
      </Shell>
    );
  }

  const statusLabel =
    task.status === "completed"
      ? "Completed"
      : task.status === "partial"
        ? "Partly completed"
        : task.status === "skipped"
          ? "Skipped"
          : "Scheduled";

  return (
    <Shell>
      <TopBar title="Task" back="/today" />
      <main className="px-5 pb-16">
        <p className="text-[13px] text-muted">
          {formatLongDate(task.date)} · {formatTime(task.time)}
        </p>
        <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.04em]">{task.title}</h1>
        <p className="mt-3 text-[15px] text-muted">
          {formatDuration(task.durationMinutes)} · {task.category} · {statusLabel}
        </p>
        {task.repeat !== "none" ? (
          <p className="mt-1 text-[13px] text-muted">
            Repeats {task.repeat === "weekdays" ? "on weekdays" : task.repeat}.
          </p>
        ) : null}
        {task.reflection ? (
          <p className="mt-6 text-[15px] leading-6">{task.reflection}</p>
        ) : null}
        <div className="mt-8 space-y-2">
          <Link href={`/tasks/${task.id}/focus`} className="flex h-[52px] items-center justify-center rounded-[14px] bg-ink text-[16px] font-medium text-white">
            Begin focus
          </Link>
          <Link href={`/tasks/${task.id}/check-in`} className="flex h-[52px] items-center justify-center rounded-[14px] bg-surface text-[16px] font-medium">
            Check in
          </Link>
          <Link href={`/tasks/${task.id}/edit`} className="flex h-[52px] items-center justify-center rounded-[14px] bg-surface text-[16px] font-medium">
            Edit
          </Link>
          <Button variant="danger" onClick={() => setConfirming(true)}>
            Delete
          </Button>
        </div>
      </main>
      <Dialog
        open={confirming}
        title="Delete this task?"
        description={
          task.repeat === "none"
            ? "This removes the task from your schedule."
            : "This removes today's occurrence. Later repeats can still appear."
        }
        onClose={() => setConfirming(false)}
      >
        <Button
          variant="danger"
          onClick={() => {
            deleteTask(task.id);
            router.push("/today");
          }}
        >
          Delete task
        </Button>
        <Button variant="ghost" onClick={() => setConfirming(false)}>
          Keep it
        </Button>
      </Dialog>
    </Shell>
  );
}
