"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, ChartColumn, FlaskConical, Plus, User, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useForge } from "@/components/forge-provider";
import { ReminderHost } from "@/components/reminder-host";
import { BootScreen, Button, cn } from "@/components/ui";

const TABS = [
  { href: "/today", label: "Today", icon: Calendar },
  { href: "/progress", label: "Progress", icon: ChartColumn },
  { href: "/experiments", label: "Experiments", icon: FlaskConical },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function Shell({
  children,
  showNav = false,
  showFab = false,
}: {
  children: ReactNode;
  showNav?: boolean;
  showFab?: boolean;
}) {
  const { mode, error, data, toast, dismissToast, notices, dismissNotice } = useForge();
  const pathname = usePathname();
  const router = useRouter();
  const needsOnboarding =
    (mode === "demo" || mode === "supabase") && !data.profile.onboarded && pathname !== "/onboarding";
  const leavingOnboarding =
    (mode === "demo" || mode === "supabase") && data.profile.onboarded && pathname === "/onboarding";

  useEffect(() => {
    if (needsOnboarding) router.replace("/onboarding");
    if (leavingOnboarding) router.replace("/today");
  }, [leavingOnboarding, needsOnboarding, router]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(dismissToast, 4200);
    return () => window.clearTimeout(id);
  }, [toast, dismissToast]);

  if (mode === "loading" || needsOnboarding || leavingOnboarding) return <BootScreen />;

  if (mode === "signed-out" || mode === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center bg-white px-6">
        <p className="text-[13px] font-medium tracking-[0.16em]">FORGE</p>
        <h1 className="mt-4 text-[32px] font-semibold tracking-[-0.04em]">
          {mode === "signed-out" ? "Sign-in required" : "Could not load your data"}
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-muted">{error}</p>
        <div className="mt-8">
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white text-ink lg:bg-[#ececee]">
      <div className="relative mx-auto min-h-dvh w-full max-w-[430px] bg-white lg:shadow-[0_0_0_1px_rgba(0,0,0,0.05)]">
        {notices.length > 0 ? (
          <div className="sticky top-0 z-40 space-y-2 bg-white/90 px-4 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-md">
            {notices.map((notice) => (
              <div key={notice.id} className="rounded-[16px] bg-surface px-3 py-3" role="status">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-medium">{notice.title}</p>
                    <p className="mt-0.5 text-[13px] leading-5 text-muted">{notice.body}</p>
                  </div>
                  <button type="button" aria-label="Dismiss reminder" onClick={() => dismissNotice(notice.id)}>
                    <X strokeWidth={1.75} className="h-4 w-4 text-muted" />
                  </button>
                </div>
                <Link href={notice.href} className="mt-2 inline-block text-[13px] font-medium">
                  Open
                </Link>
              </div>
            ))}
          </div>
        ) : null}
        {children}
        {showFab ? (
          <Link
            href="/tasks/new"
            aria-label="Add task"
            data-testid="add-task"
            className="fixed bottom-[calc(92px+env(safe-area-inset-bottom))] z-30 grid h-14 w-14 place-items-center rounded-full bg-ink text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] right-[max(18px,calc(50vw-197px))]"
          >
            <Plus strokeWidth={1.75} className="h-6 w-6" />
          </Link>
        ) : null}
        {showNav ? (
          <nav
            aria-label="Primary"
            className="fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 z-30 flex h-16 w-[min(398px,calc(100%-28px))] -translate-x-1/2 items-center justify-around rounded-[28px] border border-black/6 bg-white/80 px-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl"
          >
            {TABS.map((tab) => {
              const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-label={tab.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-full text-ink transition-colors",
                    active && "bg-[#f2f2f2]",
                  )}
                >
                  <Icon strokeWidth={1.75} className="h-[22px] w-[22px]" aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
        ) : null}
        {toast ? (
          <div
            role="status"
            className="fixed bottom-[calc(96px+env(safe-area-inset-bottom))] left-1/2 z-40 w-[min(398px,calc(100%-28px))] -translate-x-1/2 rounded-[14px] bg-ink px-4 py-3 text-[14px] text-white"
          >
            {toast}
          </div>
        ) : null}
        <ReminderHost />
      </div>
    </div>
  );
}
