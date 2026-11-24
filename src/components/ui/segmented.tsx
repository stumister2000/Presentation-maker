"use client";
import { useRef } from "react";
import { cn } from "@/lib/cn";

export function Segmented<T extends string>({
  label, value, onChange, options, className,
}: { label: string; value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string; icon?: React.ReactNode }>; className?: string }) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const idx = options.findIndex((o) => o.value === value);
  function onKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (idx + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKey} className={cn("inline-flex rounded-lg bg-surface p-1 gap-1", className)}>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => { refs.current[i] = el; }}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium text-text-muted",
            o.value === value && "bg-bg text-text shadow-card",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
