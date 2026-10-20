"use client";

import { Shell } from "@/components/shell";
import { ListGroup, ListLink, TopBar } from "@/components/ui";

export default function SettingsPage() {
  return (
    <Shell>
      <TopBar title="Settings" back="/profile" />
      <main className="px-5 pb-16">
        <ListGroup>
          <ListLink href="/settings/account" title="Account details" />
          <ListLink href="/settings/appearance" title="Appearance" />
          <ListLink href="/settings/goals" title="Personal goals" />
          <ListLink href="/settings/privacy" title="Privacy" />
          <ListLink href="/settings/export" title="Data export" />
          <ListLink href="/settings/help" title="Help and feedback" />
        </ListGroup>
      </main>
    </Shell>
  );
}
