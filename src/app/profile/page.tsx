"use client";

import { useForge } from "@/components/forge-provider";
import { Shell } from "@/components/shell";
import { ListGroup, ListLink } from "@/components/ui";

export default function ProfilePage() {
  const { data } = useForge();
  const goal = data.goals.find((item) => item.isPrimary) ?? data.goals[0];
  const initial = (data.profile.displayName.trim()[0] || "F").toUpperCase();

  return (
    <Shell showNav>
      <main className="px-5 pt-[max(20px,env(safe-area-inset-top))] pb-[calc(128px+env(safe-area-inset-bottom))]">
        <h1 className="text-[40px] font-semibold tracking-[-0.045em]">Profile</h1>
        <div className="mt-6 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-surface text-[22px] font-semibold" aria-hidden="true">
            {initial}
          </div>
          <div>
            <p className="text-[20px] font-semibold tracking-[-0.02em]">
              {data.profile.displayName || "Your name"}
            </p>
            <p className="text-[13px] text-muted">Private to this profile</p>
          </div>
        </div>
        <section className="mt-8" aria-label="Primary goal">
          <h2 className="text-[13px] font-medium text-muted">Primary goal</h2>
          {goal ? (
            <p className="mt-2 text-[20px] font-medium leading-snug tracking-[-0.02em]">{goal.title}</p>
          ) : (
            <p className="mt-2 text-[15px] text-muted">No goal yet.</p>
          )}
          {goal?.description ? <p className="mt-2 text-[14px] leading-6 text-muted">{goal.description}</p> : null}
        </section>
        <section className="mt-8" aria-label="Areas of development">
          <h2 className="text-[13px] font-medium text-muted">Areas of development</h2>
          {data.profile.areas.length === 0 ? (
            <p className="mt-2 text-[15px] text-muted">None selected.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {data.profile.areas.map((area) => (
                <li key={area} className="rounded-full bg-surface px-3 py-1.5 text-[14px]">
                  {area}
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="mt-8">
          <ListGroup>
            <ListLink href="/settings/account" title="Account" />
            <ListLink href="/settings/notifications" title="Notifications" />
            <ListLink href="/settings/privacy" title="Privacy" />
            <ListLink href="/settings" title="Settings" />
          </ListGroup>
        </div>
      </main>
    </Shell>
  );
}
