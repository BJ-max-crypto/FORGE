"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BootScreen } from "@/components/ui";
import { emptyData } from "@/lib/defaults";
import { createDemoRepository } from "@/lib/demo-repository";
import { deviceTimeZone, todayISO } from "@/lib/dates";
import { experimentEndDate } from "@/lib/reminders";
import { materializeTasks } from "@/lib/schedule";
import { createSupabaseRepository, isSupabaseConfigured } from "@/lib/supabase-repository";
import type {
  DailyReview,
  Experiment,
  ExperimentCategory,
  ForgeData,
  ForgeRepository,
  Goal,
  Profile,
  ReminderLogEntry,
  Settings,
  Task,
  TaskDraft,
  WeeklyReview,
} from "@/lib/types";

export interface Notice {
  id: string;
  title: string;
  body: string;
  href: string;
}

type Mode = "loading" | "demo" | "supabase" | "signed-out" | "error";

interface ForgeContextValue {
  mode: Mode;
  error: string | null;
  data: ForgeData;
  today: string;
  toast: string | null;
  notices: Notice[];
  dismissToast: () => void;
  dismissNotice: (id: string) => void;
  pushNotice: (notice: Omit<Notice, "id">) => void;
  addTask: (draft: TaskDraft) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  checkIn: (id: string, input: { status: "completed" | "partial" | "skipped"; reflection: string }) => void;
  rescheduleTask: (id: string, date: string, time: string, reflection: string) => void;
  saveDailyReview: (input: { date: string; mood: DailyReview["mood"]; obstacles: string; tomorrowAdjustment: string }) => void;
  saveWeeklyReview: (input: Omit<WeeklyReview, "id" | "completedAt">) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  addGoal: (title: string, description: string, makePrimary?: boolean) => string;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  setPrimaryGoal: (id: string) => void;
  startExperiment: (input: {
    title: string;
    description: string;
    hypothesis: string;
    measurePrompt: string;
    category: ExperimentCategory;
    durationDays: number;
    baseline: number;
    baselineNote: string;
    reminderEnabled: boolean;
  }) => string;
  logMeasurement: (id: string, value: number, note: string) => void;
  setExperimentReflection: (id: string, reflection: string) => void;
  decideExperiment: (id: string, decision: NonNullable<Experiment["decision"]>) => void;
  recordReminder: (key: string, channel: ReminderLogEntry["channel"]) => void;
  resetAll: () => void;
  replaceData: (data: ForgeData) => void;
  completeOnboarding: (input: { name: string; goal: string; areas: string[]; task: TaskDraft | null }) => void;
}

const ForgeContext = createContext<ForgeContextValue | null>(null);

function uid(): string {
  return crypto.randomUUID();
}

export function ForgeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("loading");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ForgeData>(() => emptyData());
  const [today, setToday] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const repoRef = useRef<ForgeRepository | null>(null);
  const dataRef = useRef(data);
  const savedRef = useRef("");
  const seq = useRef(0);
  dataRef.current = data;

  const commit = useCallback((recipe: (current: ForgeData) => ForgeData) => {
    const next = recipe(dataRef.current);
    dataRef.current = next;
    setData(next);
    const repository = repoRef.current;
    if (!repository) return;
    const id = ++seq.current;
    const snapshot = savedRef.current;
    void repository.save(next).then(
      () => {
        if (seq.current === id) savedRef.current = JSON.stringify(next);
      },
      (reason: unknown) => {
        if (seq.current !== id) return;
        const restored = snapshot ? (JSON.parse(snapshot) as ForgeData) : emptyData(deviceTimeZone());
        savedRef.current = snapshot;
        dataRef.current = restored;
        setData(restored);
        setToast(reason instanceof Error ? reason.message : "Could not save. The last change was reverted.");
      },
    );
  }, []);

  useEffect(() => {
    let cancel = false;
    const repository = isSupabaseConfigured()
      ? createSupabaseRepository()
      : createDemoRepository(window.localStorage);
    repoRef.current = repository;
    void repository.load().then((result) => {
      if (cancel) return;
      if (!result.ok) {
        setError(result.message);
        setMode(result.reason === "unauthenticated" ? "signed-out" : "error");
        return;
      }
      const now = new Date();
      const zone = result.data.profile.timezone || deviceTimeZone();
      let next = result.data;
      if (!next.profile.timezone) {
        next = { ...next, profile: { ...next.profile, timezone: zone } };
      }
      const day = todayISO(now);
      const extras = materializeTasks(next.tasks, day, now.toISOString(), uid);
      if (extras.length) next = { ...next, tasks: [...next.tasks, ...extras] };
      dataRef.current = next;
      savedRef.current = JSON.stringify(result.data);
      setData(next);
      setToday(day);
      setMode(repository.mode);
      if (JSON.stringify(next) !== JSON.stringify(result.data)) {
        void repository.save(next).then(() => {
          savedRef.current = JSON.stringify(next);
        });
      }
    });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== "demo" && mode !== "supabase") return;
    const id = window.setInterval(() => {
      const day = todayISO();
      setToday(day);
      const extras = materializeTasks(dataRef.current.tasks, day, new Date().toISOString(), uid);
      if (extras.length === 0) return;
      commit((current) => ({ ...current, tasks: [...current.tasks, ...extras] }));
    }, 60_000);
    return () => window.clearInterval(id);
  }, [mode, commit]);

  useEffect(() => {
    if (mode === "loading") return;
    document.documentElement.dataset.text = data.settings.textSize;
    document.documentElement.dataset.motion = data.settings.reduceMotion ? "reduce" : "ok";
  }, [data.settings.reduceMotion, data.settings.textSize, mode]);

  const api = useMemo<ForgeContextValue>(() => {
    const stamp = () => new Date().toISOString();
    return {
      mode,
      error,
      data,
      today,
      toast,
      notices,
      dismissToast: () => setToast(null),
      dismissNotice: (id) => setNotices((current) => current.filter((notice) => notice.id !== id)),
      pushNotice: (notice) =>
        setNotices((current) => [{ ...notice, id: uid() }, ...current].slice(0, 3)),
      addTask: (draft) => {
        const id = uid();
        const now = stamp();
        const task: Task = {
          id,
          seriesId: id,
          title: draft.title.trim(),
          date: draft.date,
          time: draft.time,
          durationMinutes: draft.durationMinutes,
          category: draft.category,
          repeat: draft.repeat,
          reminderEnabled: draft.reminderEnabled,
          status: "scheduled",
          completedAt: null,
          reflection: "",
          createdAt: now,
          updatedAt: now,
        };
        commit((current) => ({ ...current, tasks: [...current.tasks, task] }));
        return id;
      },
      updateTask: (id, patch) => {
        commit((current) => ({
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === id ? { ...task, ...patch, updatedAt: stamp() } : task,
          ),
        }));
      },
      deleteTask: (id) => {
        commit((current) => {
          const task = current.tasks.find((item) => item.id === id);
          if (!task) return current;
          const repeating = current.tasks.some(
            (item) => item.seriesId === task.seriesId && item.repeat !== "none",
          );
          if (!repeating) {
            return { ...current, tasks: current.tasks.filter((item) => item.id !== id) };
          }
          return {
            ...current,
            tasks: current.tasks.map((item) =>
              item.id === id ? { ...item, status: "cancelled", updatedAt: stamp() } : item,
            ),
          };
        });
      },
      checkIn: (id, input) => {
        commit((current) => ({
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  status: input.status,
                  reflection: input.reflection.trim(),
                  completedAt: stamp(),
                  updatedAt: stamp(),
                }
              : task,
          ),
        }));
      },
      rescheduleTask: (id, date, time, reflection) => {
        commit((current) => {
          const task = current.tasks.find((item) => item.id === id);
          if (!task) return current;
          const now = stamp();
          if (task.repeat === "none") {
            return {
              ...current,
              tasks: current.tasks.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      date,
                      time,
                      status: "scheduled",
                      completedAt: null,
                      reflection: reflection.trim(),
                      updatedAt: now,
                    }
                  : item,
              ),
            };
          }
          const moved: Task = {
            ...task,
            id: uid(),
            seriesId: uid(),
            date,
            time,
            repeat: "none",
            status: "scheduled",
            completedAt: null,
            reflection: reflection.trim(),
            createdAt: now,
            updatedAt: now,
          };
          return {
            ...current,
            tasks: [
              ...current.tasks.map((item) =>
                item.id === id ? { ...item, status: "cancelled" as const, updatedAt: now } : item,
              ),
              moved,
            ],
          };
        });
      },
      saveDailyReview: (input) => {
        commit((current) => {
          const now = stamp();
          const existing = current.reviews.find((review) => review.date === input.date);
          const review: DailyReview = {
            id: existing?.id ?? uid(),
            date: input.date,
            mood: input.mood,
            obstacles: input.obstacles.trim(),
            tomorrowAdjustment: input.tomorrowAdjustment.trim(),
            completedAt: now,
          };
          return {
            ...current,
            reviews: existing
              ? current.reviews.map((item) => (item.date === input.date ? review : item))
              : [...current.reviews, review],
          };
        });
      },
      saveWeeklyReview: (input) => {
        commit((current) => {
          const now = stamp();
          const existing = current.weeklyReviews.find((review) => review.weekStart === input.weekStart);
          const review: WeeklyReview = { ...input, id: existing?.id ?? uid(), completedAt: now };
          return {
            ...current,
            weeklyReviews: existing
              ? current.weeklyReviews.map((item) => (item.weekStart === input.weekStart ? review : item))
              : [...current.weeklyReviews, review],
          };
        });
      },
      updateProfile: (patch) => {
        commit((current) => ({ ...current, profile: { ...current.profile, ...patch } }));
      },
      updateSettings: (patch) => {
        commit((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
      },
      addGoal: (title, description, makePrimary = false) => {
        const id = uid();
        const now = stamp();
        commit((current) => ({
          ...current,
          goals: [
            ...current.goals.map((goal) =>
              makePrimary ? { ...goal, isPrimary: false } : goal,
            ),
            {
              id,
              title: title.trim(),
              description: description.trim(),
              priority: current.goals.length,
              isPrimary: makePrimary || current.goals.length === 0,
              createdAt: now,
              updatedAt: now,
            },
          ],
        }));
        return id;
      },
      updateGoal: (id, patch) => {
        commit((current) => ({
          ...current,
          goals: current.goals.map((goal) =>
            goal.id === id ? { ...goal, ...patch, updatedAt: stamp() } : goal,
          ),
        }));
      },
      deleteGoal: (id) => {
        commit((current) => {
          const remaining = current.goals.filter((goal) => goal.id !== id);
          if (remaining.length > 0 && !remaining.some((goal) => goal.isPrimary)) {
            remaining[0] = { ...remaining[0], isPrimary: true };
          }
          return { ...current, goals: remaining };
        });
      },
      setPrimaryGoal: (id) => {
        commit((current) => ({
          ...current,
          goals: current.goals.map((goal) => ({ ...goal, isPrimary: goal.id === id })),
        }));
      },
      startExperiment: (input) => {
        const id = uid();
        const now = stamp();
        const start = today || todayISO();
        const experiment: Experiment = {
          id,
          title: input.title.trim(),
          description: input.description.trim(),
          hypothesis: input.hypothesis.trim(),
          measurePrompt: input.measurePrompt.trim() || "How did this go today, from 1 to 10?",
          category: input.category,
          durationDays: input.durationDays,
          startDate: start,
          endDate: experimentEndDate(start, input.durationDays),
          baseline: input.baseline,
          baselineNote: input.baselineNote.trim(),
          measurements: [],
          reflection: "",
          status: "active",
          decision: null,
          reminderEnabled: input.reminderEnabled,
          createdAt: now,
          updatedAt: now,
        };
        commit((current) => ({ ...current, experiments: [experiment, ...current.experiments] }));
        return id;
      },
      logMeasurement: (id, value, note) => {
        const day = today || todayISO();
        commit((current) => ({
          ...current,
          experiments: current.experiments.map((experiment) => {
            if (experiment.id !== id) return experiment;
            const measurements = experiment.measurements.filter((item) => item.date !== day);
            measurements.push({ date: day, value, note: note.trim() });
            measurements.sort((a, b) => a.date.localeCompare(b.date));
            return { ...experiment, measurements, updatedAt: stamp() };
          }),
        }));
      },
      setExperimentReflection: (id, reflection) => {
        commit((current) => ({
          ...current,
          experiments: current.experiments.map((experiment) =>
            experiment.id === id ? { ...experiment, reflection, updatedAt: stamp() } : experiment,
          ),
        }));
      },
      decideExperiment: (id, decision) => {
        commit((current) => ({
          ...current,
          experiments: current.experiments.map((experiment) =>
            experiment.id === id
              ? { ...experiment, decision, status: "completed", updatedAt: stamp() }
              : experiment,
          ),
        }));
      },
      recordReminder: (key, channel) => {
        commit((current) => {
          if (current.reminderLog.some((entry) => entry.key === key)) return current;
          return {
            ...current,
            reminderLog: [{ id: uid(), key, channel, firedAt: stamp() }, ...current.reminderLog].slice(0, 200),
          };
        });
      },
      resetAll: () => {
        const next = emptyData(deviceTimeZone());
        dataRef.current = next;
        setData(next);
        setNotices([]);
        const repository = repoRef.current;
        if (!repository) return;
        void repository.save(next).then(() => {
          savedRef.current = JSON.stringify(next);
        });
      },
      replaceData: (next) => {
        commit(() => next);
      },
      completeOnboarding: ({ name, goal, areas, task }) => {
        const now = stamp();
        const goalId = uid();
        commit((current) => {
          const tasks = [...current.tasks];
          if (task) {
            const taskId = uid();
            tasks.push({
              id: taskId,
              seriesId: taskId,
              title: task.title.trim(),
              date: task.date,
              time: task.time,
              durationMinutes: task.durationMinutes,
              category: task.category,
              repeat: task.repeat,
              reminderEnabled: task.reminderEnabled,
              status: "scheduled",
              completedAt: null,
              reflection: "",
              createdAt: now,
              updatedAt: now,
            });
          }
          return {
            ...current,
            profile: {
              displayName: name.trim(),
              areas,
              onboarded: true,
              timezone: deviceTimeZone(),
            },
            goals: [
              {
                id: goalId,
                title: goal.trim(),
                description: "",
                priority: 0,
                isPrimary: true,
                createdAt: now,
                updatedAt: now,
              },
              ...current.goals.map((item) => ({ ...item, isPrimary: false })),
            ],
            tasks,
          };
        });
      },
    };
  }, [commit, data, error, mode, notices, today, toast]);

  if (mode === "loading") return <BootScreen />;

  return <ForgeContext.Provider value={api}>{children}</ForgeContext.Provider>;
}

export function useForge(): ForgeContextValue {
  const value = useContext(ForgeContext);
  if (!value) throw new Error("useForge must be used within ForgeProvider");
  return value;
}
