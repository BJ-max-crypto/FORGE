"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { Button, Dialog, TopBar } from "@/components/ui";

export default function PrivacyPage() {
  const { mode, resetAll } = useForge();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Shell>
      <TopBar title="Privacy" back="/settings" />
      <main className="px-5 pb-16">
        <div className="space-y-4 text-[15px] leading-6">
          <p>FORGE stores tasks, reviews, experiments, and goals for one person. There is no social feed.</p>
          {mode === "demo" ? (
            <p>
              Demo mode keeps that record in local storage on this device. Anyone with access to this browser profile can open it. Clearing site data deletes it. It is not sent to a server by the app.
            </p>
          ) : (
            <p>
              Supabase mode stores rows under your signed-in user id. Row-level security is expected to restrict each account to its own rows. The service role key, if you add one, must stay on the server.
            </p>
          )}
          <p>Notifications, when allowed, include the task title. They do not include your reflection notes.</p>
        </div>
        <div className="mt-8">
          <Button variant="danger" onClick={() => setOpen(true)}>
            Delete all local data
          </Button>
        </div>
      </main>
      <Dialog
        open={open}
        title="Delete everything stored here?"
        description="This clears the profile, tasks, reviews, experiments, and goals in the current data store and returns you to the start."
        onClose={() => setOpen(false)}
      >
        <Button
          variant="danger"
          onClick={() => {
            resetAll();
            setOpen(false);
            router.replace("/onboarding");
          }}
        >
          Delete data
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </Dialog>
    </Shell>
  );
}
