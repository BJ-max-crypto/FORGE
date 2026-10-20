"use client";

import Link from "next/link";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-[52px] w-full items-center justify-center rounded-[14px] px-4 text-[16px] font-medium transition-colors duration-200 disabled:opacity-40",
        variant === "primary" && "bg-ink text-white hover:bg-black",
        variant === "secondary" && "bg-surface text-ink hover:bg-[#ececee]",
        variant === "ghost" && "h-11 bg-transparent text-muted hover:text-ink",
        variant === "danger" && "bg-transparent text-danger hover:bg-[#f8eeee]",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const id = useId();
  const sole = Children.count(children) === 1 && isValidElement(children)
    ? (children as ReactElement<{ id?: string }>)
    : null;
  return (
    <div>
      {sole ? (
        <label htmlFor={id} className="mb-2 block text-[13px] font-medium">
          {label}
        </label>
      ) : (
        <span id={id} className="mb-2 block text-[13px] font-medium">
          {label}
        </span>
      )}
      {sole ? cloneElement(sole, { id }) : <div role="group" aria-labelledby={id}>{children}</div>}
      {error ? (
        <span className="mt-1.5 block text-[13px] text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[13px] leading-5 text-muted">{hint}</span>
      ) : null}
    </div>
  );
}

const controlClass =
  "h-[52px] w-full rounded-[14px] bg-surface px-4 text-[16px] text-ink outline-none ring-1 ring-transparent transition focus:ring-black/15";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClass, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-28 w-full resize-none rounded-[14px] bg-surface px-4 py-3 text-[16px] leading-6 outline-none ring-1 ring-transparent transition focus:ring-black/15",
        props.className,
      )}
    />
  );
}

export function ProgressBar({
  value,
  tone = "ink",
}: {
  value: number | null;
  tone?: "ink" | "green";
}) {
  const width = value == null ? 0 : Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-[#ececee]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-300", tone === "green" ? "bg-green" : "bg-ink")}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[18px] bg-surface px-4 py-5">
      <p className="text-[16px] font-medium">{title}</p>
      <p className="mt-1.5 text-[14px] leading-6 text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function TopBar({
  title,
  back,
  right,
}: {
  title: string;
  back?: string;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center bg-white/85 px-2 backdrop-blur-md">
      {back ? (
        <Link href={back} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full">
          <ChevronLeft strokeWidth={1.75} className="h-6 w-6" />
        </Link>
      ) : (
        <span className="w-10" />
      )}
      <h1 className="flex-1 truncate text-center text-[17px] font-semibold tracking-[-0.01em]">{title}</h1>
      <div className="flex w-10 justify-end">{right}</div>
    </header>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1 rounded-[14px] bg-surface p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-10 min-w-0 rounded-[11px] px-1 text-[13px] font-medium",
              selected ? "bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "text-muted",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "h-10 rounded-full px-3.5 text-[14px] font-medium",
        selected ? "bg-ink text-white" : "bg-surface text-ink",
      )}
    >
      {children}
    </button>
  );
}

export function Switch({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  label: string;
  description?: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span>
        <span className="block text-[16px]">{label}</span>
        {description ? <span className="mt-0.5 block text-[13px] leading-5 text-muted">{description}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors",
          checked ? "bg-ink" : "bg-[#e1e1e4]",
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-[2px]",
          )}
        />
      </button>
    </div>
  );
}

export function ListGroup({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-black/5 overflow-hidden rounded-[18px] bg-surface">{children}</div>;
}

export function ListLink({
  href,
  title,
  detail,
}: {
  href: string;
  title: string;
  detail?: string;
}) {
  return (
    <Link href={href} className="flex min-h-[52px] items-center justify-between gap-3 px-4 py-3">
      <span className="text-[16px]">{title}</span>
      <span className="flex items-center gap-1 text-[14px] text-muted">
        {detail}
        <ChevronRight strokeWidth={1.75} className="h-4 w-4" />
      </span>
    </Link>
  );
}

export function Dialog({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:items-center"
      onMouseDown={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-[400px] rounded-[20px] bg-white p-5 shadow-[0_16px_50px_rgba(0,0,0,0.16)] outline-none"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-[18px] font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        {description ? <p className="mt-2 text-[14px] leading-6 text-muted">{description}</p> : null}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function BootScreen({ label = "FORGE" }: { label?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-white">
      <p className="text-[13px] font-medium tracking-[0.18em] text-ink">{label}</p>
    </div>
  );
}
