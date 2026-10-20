import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center bg-white px-6">
      <p className="text-[13px] font-medium tracking-[0.16em]">FORGE</p>
      <h1 className="mt-4 text-[32px] font-semibold tracking-[-0.04em]">This page is not here</h1>
      <p className="mt-3 text-[15px] leading-6 text-muted">The link may be old, or the item was removed.</p>
      <Link href="/today" className="mt-8 inline-flex h-[52px] items-center justify-center rounded-[14px] bg-ink text-[16px] font-medium text-white">
        Back to Today
      </Link>
    </div>
  );
}
