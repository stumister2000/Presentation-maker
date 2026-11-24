"use client";
import { cn } from "@/lib/cn";

export function Chip({ selected, className, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected === undefined ? undefined : selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-sm",
        selected ? "bg-accent-soft text-accent border-transparent" : "border-border bg-bg text-text hover:bg-surface",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
