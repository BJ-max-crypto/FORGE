import Link from "next/link";
import { Check } from "lucide-react";
import { formatDuration, formatTime, minutesFromTime } from "@/lib/dates";
import type { Task } from "@/lib/types";
import { cn } from "@/components/ui";

function dotClass(task: Task, emphasized: boolean): string {
  if (task.status === "completed") return "bg-green";
  if (task.status === "partial") return "border-2 border-green bg-white";
  if (task.status === "skipped") return "bg-[#d6d6d8]";
  if (emphasized) return "bg-ink ring-4 ring-black/10";
  return "border border-black/25 bg-white";
}

export function TaskTimeline({
  tasks,
  nowMinutes,
  highlightId,
}: {
  tasks: Task[];
  nowMinutes: number;
  highlightId: string | null;
}) {
  return (
    <ol>
      {tasks.map((task, index) => {
        const emphasized = task.id === highlightId && task.status === "scheduled";
        const past = minutesFromTime(task.time) < nowMinutes;
        return (
          <li key={task.id} className="grid grid-cols-[68px_18px_minmax(0,1fr)]">
            <time
              dateTime={`${task.date}T${task.time}`}
              className={cn(
                "pt-[14px] pr-2 text-right text-[13px] tabular-nums",
                past && task.status !== "scheduled" ? "text-faint" : "text-muted",
              )}
            >
              {formatTime(task.time)}
            </time>
            <div className="relative flex justify-center">
              {index < tasks.length - 1 ? (
                <span className="absolute top-5 bottom-0 w-px bg-line" aria-hidden="true" />
              ) : null}
              <span
                className={cn("relative z-10 mt-[16px] h-2.5 w-2.5 rounded-full", dotClass(task, emphasized))}
                aria-hidden="true"
              />
            </div>
            <div className={cn("mb-1.5 flex items-start gap-1 rounded-[16px] pr-1", emphasized && "bg-surface")}>
              <Link href={`/tasks/${task.id}`} className="min-w-0 flex-1 px-3 py-3">
                <span className="sr-only">
                  {task.status === "completed"
                    ? "Completed"
                    : task.status === "partial"
                      ? "Partly completed"
                      : task.status === "skipped"
                        ? "Skipped"
                        : emphasized
                          ? "Up next"
                          : "Scheduled"}
                </span>
                {emphasized ? <span className="mb-1 block text-[12px] font-medium text-muted">Up next</span> : null}
                <span
                  className={cn(
                    "block text-[16px] font-medium leading-5 tracking-[-0.01em]",
                    task.status === "completed" && "text-muted",
                  )}
                >
                  {task.title}
                </span>
                <span className="mt-1 block text-[13px] text-muted">
                  {formatDuration(task.durationMinutes)} · {task.category}
                </span>
              </Link>
              <Link
                href={`/tasks/${task.id}/check-in`}
                aria-label={`Check in ${task.title}`}
                className={cn(
                  "mr-2 mt-3 grid h-8 w-8 shrink-0 place-items-center rounded-full border",
                  task.status === "completed" ? "border-green bg-green-soft text-green" : "border-black/10 text-ink",
                )}
              >
                <Check strokeWidth={1.75} className="h-4 w-4" />
              </Link>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
