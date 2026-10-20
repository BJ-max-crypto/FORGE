"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { Button, TopBar } from "@/components/ui";
import { formatDuration } from "@/lib/dates";

function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export default function FocusPage() {
  const params = useParams<{ id: string }>();
  const { data } = useForge();
  const task = data.tasks.find((item) => item.id === params.id && item.status !== "cancelled");
  const total = (task?.durationMinutes ?? 25) * 60;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const endAt = useRef<number | null>(null);
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;

  useEffect(() => {
    if (!running) return;
    endAt.current = Date.now() + remainingRef.current * 1000;
    const id = window.setInterval(() => {
      if (endAt.current == null) return;
      const next = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      remainingRef.current = next;
      setRemaining(next);
      if (next <= 0) {
        endAt.current = null;
        setRunning(false);
      }
    }, 200);
    return () => {
      window.clearInterval(id);
      if (endAt.current != null) {
        const next = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
        remainingRef.current = next;
        endAt.current = null;
      }
    };
  }, [running]);

  if (!task) {
    return (
      <Shell>
        <TopBar title="Focus" back="/today" />
        <p className="px-5 pt-8 text-[15px] text-muted">This task is no longer available.</p>
      </Shell>
    );
  }

  const finished = remaining === 0 && !running;
  const started = remaining !== total;

  return (
    <Shell>
      <TopBar title="Focus" back={`/tasks/${task.id}`} />
      <main className="flex min-h-[calc(100dvh-56px)] flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-[13px] text-muted">{formatDuration(task.durationMinutes)} scheduled</p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.03em]">{task.title}</h1>
          <p
            className="mt-10 text-[72px] font-semibold leading-none tracking-[-0.05em] tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatClock(remaining)}
          </p>
          <p className="mt-3 text-[14px] text-muted">{finished ? "Time is up." : running ? "In progress" : started ? "Paused" : "Ready when you are"}</p>
        </div>
        <div className="space-y-2">
          {!running && !finished ? (
            <Button
              onClick={() => {
                if (remaining === 0) {
                  remainingRef.current = total;
                  setRemaining(total);
                }
                setRunning(true);
              }}
            >
              {started ? "Resume" : "Start"}
            </Button>
          ) : null}
          {running ? (
            <Button
              onClick={() => {
                if (endAt.current != null) {
                  const next = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
                  remainingRef.current = next;
                  setRemaining(next);
                  endAt.current = null;
                }
                setRunning(false);
              }}
            >
              Pause
            </Button>
          ) : null}
          <Link
            href={`/tasks/${task.id}/check-in`}
            className="flex h-[52px] items-center justify-center rounded-[14px] bg-surface text-[16px] font-medium"
          >
            Finish
          </Link>
          <Link href={`/tasks/${task.id}/check-in?intent=reschedule`} className="flex h-11 items-center justify-center text-[15px] text-muted">
            Reschedule
          </Link>
        </div>
      </main>
    </Shell>
  );
}
