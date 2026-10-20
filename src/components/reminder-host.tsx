"use client";

import { useEffect, useRef } from "react";
import { useForge } from "@/components/forge-provider";
import { clockInZone } from "@/lib/dates";
import { dueReminders, planReminders } from "@/lib/reminders";

async function showSystemNotification(title: string, body: string, href: string): Promise<boolean> {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification(title, { body, data: { href }, tag: href });
      return true;
    }
    new Notification(title, { body });
    return true;
  } catch {
    return false;
  }
}

export function ReminderHost() {
  const { mode, data, pushNotice, recordReminder } = useForge();
  const dataRef = useRef(data);
  dataRef.current = data;
  const pushing = useRef(false);

  useEffect(() => {
    if (mode !== "demo" && mode !== "supabase") return;

    const tick = () => {
      if (pushing.current) return;
      const current = dataRef.current;
      const clock = clockInZone(new Date(), current.profile.timezone || "UTC");
      const planned = planReminders(current, clock);
      const already = new Set(current.reminderLog.map((entry) => entry.key));
      const { due, suppressed } = dueReminders(planned, clock, already, current.settings);
      if (due.length === 0 && suppressed.length === 0) return;
      pushing.current = true;
      for (const reminder of suppressed) recordReminder(reminder.key, "suppressed");
      for (const reminder of due) {
        pushNotice({ title: reminder.title, body: reminder.body, href: reminder.href });
        const hidden = document.visibilityState === "hidden";
        if (mode === "demo" && hidden) {
          void showSystemNotification(reminder.title, reminder.body, reminder.href).then((delivered) => {
            recordReminder(reminder.key, delivered ? "system" : "in-app");
          });
        } else {
          recordReminder(reminder.key, "in-app");
        }
      }
      window.setTimeout(() => {
        pushing.current = false;
      }, 400);
    };

    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [mode, pushNotice, recordReminder]);

  return null;
}
