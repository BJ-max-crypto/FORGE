"use client";

import { useState } from "react";
import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { Button, TopBar } from "@/components/ui";
import { todayISO } from "@/lib/dates";
import { sanitizeImport } from "@/lib/validation";

export default function ExportPage() {
  const { data, replaceData } = useForge();
  const [message, setMessage] = useState("");

  return (
    <Shell>
      <TopBar title="Data export" back="/settings" />
      <main className="px-5 pb-16">
        <p className="text-[15px] leading-6 text-muted">
          Download a JSON copy of your FORGE record, or restore one you exported earlier. Import replaces the current record.
        </p>
        <div className="mt-6 space-y-2">
          <Button
            onClick={() => {
              const blob = new Blob([JSON.stringify({ version: 1, data }, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `forge-${todayISO()}.json`;
              link.click();
              URL.revokeObjectURL(url);
              setMessage("Export downloaded.");
            }}
          >
            Download JSON
          </Button>
          <label className="flex h-[52px] cursor-pointer items-center justify-center rounded-[14px] bg-surface text-[16px] font-medium">
            Import JSON
            <input
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  const parsed = JSON.parse(await file.text()) as { data?: unknown };
                  const candidate = parsed && typeof parsed === "object" && "data" in parsed ? parsed.data : parsed;
                  const next = sanitizeImport(candidate);
                  if (!next) {
                    setMessage("That file is not a FORGE export.");
                    return;
                  }
                  replaceData(next);
                  setMessage("Import saved.");
                } catch {
                  setMessage("The file could not be read.");
                }
              }}
            />
          </label>
        </div>
        {message ? <p className="mt-4 text-[14px]">{message}</p> : null}
      </main>
    </Shell>
  );
}
