"use client";

import { useEffect, useState } from "react";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { Button, Field, Switch, TextInput, TopBar } from "@/components/ui";

type PermissionState = "unsupported" | NotificationPermission;

async function registerBackgroundPush(setNote: (note: string) => void) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    setNote("The VAPID public key is not set. Background push was not registered, and nothing was delivered.");
    return;
  }
  if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) {
    setNote("This browser cannot register a push subscription.");
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    setNote("Permission was not granted. No subscription was stored.");
    return;
  }
  const registration = await navigator.serviceWorker.register("/sw.js");
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  const payload = (await response.json()) as { reason?: string; delivered?: boolean };
  setNote(payload.reason ?? "The server did not explain the result.");
  if (payload.delivered) setNote("A notification was reported as delivered.");
}

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let index = 0; index < raw.length; index += 1) output[index] = raw.charCodeAt(index);
  return output;
}

export default function NotificationSettingsPage() {
  const { data, updateSettings } = useForge();
  const [permission, setPermission] = useState<PermissionState>("unsupported");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const permissionCopy =
    permission === "granted"
      ? "Allowed in this browser."
      : permission === "denied"
        ? "Blocked in this browser. You can change that in the browser's site settings. In-app reminders still appear while FORGE is open."
        : permission === "default"
          ? "Not requested yet."
          : "This browser does not support notifications.";

  async function request() {
    if (typeof Notification === "undefined") {
      setNote("Notifications are not available here.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted" && "serviceWorker" in navigator) {
      await navigator.serviceWorker.register("/sw.js");
      setNote("Permission granted. Reminders can appear while this tab is open, and as a system notification if the tab is in the background.");
    } else if (result === "denied") {
      setNote("Permission was denied. No system notification will be sent.");
    }
  }

  return (
    <Shell>
      <TopBar title="Notifications" back="/profile" />
      <main className="px-5 pb-16">
        <p className="text-[14px] leading-6 text-muted">{permissionCopy}</p>
        {permission !== "granted" && permission !== "unsupported" ? (
          <div className="mt-4">
            <Button onClick={() => void request()}>Allow notifications</Button>
          </div>
        ) : null}
        {note ? <p className="mt-3 text-[14px] leading-6">{note}</p> : null}
        <div className="mt-6 divide-y divide-black/5 rounded-[18px] bg-surface px-4">
          <Switch
            checked={data.settings.pauseAll}
            label="Pause all"
            description="Stops every reminder until you turn this off."
            onChange={(pauseAll) => updateSettings({ pauseAll })}
          />
          <Switch
            checked={data.settings.taskStartReminders}
            label="Task-start reminders"
            description="For tasks that have their own reminder turned on."
            onChange={(taskStartReminders) => updateSettings({ taskStartReminders })}
          />
          <Switch
            checked={data.settings.incompleteFollowUp}
            label="Incomplete-task follow-up"
            description="A second nudge 10 minutes after a task should have ended, if it is still open."
            onChange={(incompleteFollowUp) => updateSettings({ incompleteFollowUp })}
          />
          <Switch
            checked={data.settings.dailyReviewReminder}
            label="Daily review"
            onChange={(dailyReviewReminder) => updateSettings({ dailyReviewReminder })}
          />
          <Switch
            checked={data.settings.quietHoursEnabled}
            label="Quiet hours"
            description="Reminders that fall in this window are skipped, not delayed."
            onChange={(quietHoursEnabled) => updateSettings({ quietHoursEnabled })}
          />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Field label="Review time">
            <TextInput
              type="time"
              value={data.settings.dailyReviewTime}
              onChange={(event) => updateSettings({ dailyReviewTime: event.target.value })}
            />
          </Field>
          <Field label="Quiet from">
            <TextInput
              type="time"
              value={data.settings.quietStart}
              onChange={(event) => updateSettings({ quietStart: event.target.value })}
            />
          </Field>
          <Field label="Quiet until">
            <TextInput
              type="time"
              value={data.settings.quietEnd}
              onChange={(event) => updateSettings({ quietEnd: event.target.value })}
            />
          </Field>
        </div>
        <p className="mt-6 text-[13px] leading-6 text-muted">
          Background delivery after the site is closed needs Web Push keys and a scheduled sender. Until those are configured, FORGE only notifies while it is open. A saved preference is not a delivered notification.
        </p>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => void registerBackgroundPush(setNote)}>
            Register background push
          </Button>
        </div>
      </main>
    </Shell>
  );
}
