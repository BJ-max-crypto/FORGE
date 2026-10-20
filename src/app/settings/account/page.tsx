"use client";

import { useState } from "react";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { Button, Field, TextInput, TopBar } from "@/components/ui";
import { deviceTimeZone } from "@/lib/dates";
import { isSupabaseConfigured } from "@/lib/supabase-repository";

export default function AccountPage() {
  const { data, mode, updateProfile } = useForge();
  const [name, setName] = useState(data.profile.displayName);
  const [saved, setSaved] = useState(false);

  return (
    <Shell>
      <TopBar title="Account" back="/settings" />
      <main className="px-5 pb-16">
        <Field label="Name">
          <TextInput value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
        </Field>
        <div className="mt-4">
          <Button
            onClick={() => {
              if (!name.trim()) return;
              updateProfile({ displayName: name.trim() });
              setSaved(true);
            }}
          >
            Save name
          </Button>
        </div>
        {saved ? <p className="mt-3 text-[13px] text-green">Saved.</p> : null}
        <dl className="mt-8 space-y-4 text-[14px]">
          <div>
            <dt className="text-muted">Storage</dt>
            <dd className="mt-1 leading-6">
              {mode === "supabase"
                ? "Connected to your Supabase project. Only your signed-in account can read these rows."
                : "Demo mode. Data stays in this browser's local storage. It is not encrypted and it is not synced."}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Timezone</dt>
            <dd className="mt-1">{data.profile.timezone}</dd>
          </div>
          <div>
            <dt className="text-muted">Supabase configuration</dt>
            <dd className="mt-1">{isSupabaseConfigured() ? "Environment variables are present." : "Not configured."}</dd>
          </div>
        </dl>
        <div className="mt-6">
          <Button variant="secondary" onClick={() => updateProfile({ timezone: deviceTimeZone() })}>
            Use this device&apos;s timezone
          </Button>
        </div>
      </main>
    </Shell>
  );
}
