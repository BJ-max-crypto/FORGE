"use client";

import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { Chip, Switch, TopBar } from "@/components/ui";

export default function AppearancePage() {
  const { data, updateSettings } = useForge();

  return (
    <Shell>
      <TopBar title="Appearance" back="/settings" />
      <main className="px-5 pb-16">
        <p className="text-[14px] leading-6 text-muted">
          FORGE stays in the light monochrome palette from the design. Text size and motion can change.
        </p>
        <h2 className="mt-6 text-[13px] font-medium text-muted">Text size</h2>
        <div className="mt-3 flex gap-2">
          <Chip selected={data.settings.textSize === "default"} onClick={() => updateSettings({ textSize: "default" })}>
            Default
          </Chip>
          <Chip selected={data.settings.textSize === "large"} onClick={() => updateSettings({ textSize: "large" })}>
            Large
          </Chip>
        </div>
        <div className="mt-6 rounded-[18px] bg-surface px-4">
          <Switch
            checked={data.settings.reduceMotion}
            label="Reduce motion"
            description="Turns off transitions in FORGE."
            onChange={(reduceMotion) => updateSettings({ reduceMotion })}
          />
        </div>
      </main>
    </Shell>
  );
}
