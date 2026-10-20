"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForge } from "@/components/forge-provider";
import { BootScreen } from "@/components/ui";

export default function HomePage() {
  const { mode, data } = useForge();
  const router = useRouter();

  useEffect(() => {
    if (mode === "loading" || mode === "signed-out" || mode === "error") return;
    router.replace(data.profile.onboarded ? "/today" : "/onboarding");
  }, [data.profile.onboarded, mode, router]);

  return <BootScreen />;
}
