"use client";

import { Button } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center bg-white px-6">
      <p className="text-[13px] font-medium tracking-[0.16em]">FORGE</p>
      <h1 className="mt-4 text-[32px] font-semibold tracking-[-0.04em]">Something went wrong</h1>
      <p className="mt-3 text-[15px] leading-6 text-muted">{error.message || "The screen could not be shown."}</p>
      <div className="mt-8">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
