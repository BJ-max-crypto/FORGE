"use client";

import { useState } from "react";
import { Shell } from "@/components/shell";
import { Button, Field, TextArea, TopBar } from "@/components/ui";

export default function HelpPage() {
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  return (
    <Shell>
      <TopBar title="Help" back="/settings" />
      <main className="space-y-4 px-5 pb-16 text-[15px] leading-6">
        <p>Plan the day on Today. Open a task to focus, then check it in as completed, partly done, skipped, or rescheduled.</p>
        <p>Progress only counts tasks you have recorded. Empty days are not treated as failures.</p>
        <p>Experiments compare a baseline rating with the ratings you log. A difference is a clue, not proof of cause.</p>
        <p>
          Reminders appear in the app while it is open. System notifications require permission and still may not arrive if the browser has suspended the page. Background push needs the VAPID and Supabase setup in the project README. FORGE will not tell you a reminder was delivered if it was only saved.
        </p>
        <Field label="Feedback" hint="There is no feedback server connected. Copy this note and send it yourself.">
          <TextArea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} />
        </Field>
        <Button
          variant="secondary"
          onClick={async () => {
            const text = note.trim() || "FORGE feedback";
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Copied" : "Copy feedback"}
        </Button>
      </main>
    </Shell>
  );
}
