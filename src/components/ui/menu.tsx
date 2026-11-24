"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface MenuItem { label: string; icon?: React.ReactNode; onSelect: () => void; danger?: boolean; disabled?: boolean }

/** A button that opens a small menu. Arrow keys move, Enter selects, Esc closes. */
export function Menu({ trigger, items, label, align = "right", className }: {
  trigger: React.ReactNode; items: MenuItem[]; label: string; align?: "left" | "right"; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();
    const close = (e: MouseEvent) => { if (!list.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  function onKey(e: React.KeyboardEvent) {
    const els = Array.from(list.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []);
    const i = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") { e.preventDefault(); els[(i + 1) % els.length]?.focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); els[(i - 1 + els.length) % els.length]?.focus(); }
    if (e.key === "Escape" || e.key === "Tab") { setOpen(false); btn.current?.focus(); }
  }
  return (
    <div className={cn("relative", className)}>
      <button ref={btn} type="button" aria-haspopup="menu" aria-expanded={open} aria-label={label}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        className="inline-flex items-center justify-center rounded-md h-8 min-w-8 px-1.5 text-text-muted hover:bg-surface hover:text-text">
        {trigger}
      </button>
      {open && (
        <div ref={list} role="menu" aria-label={label} onKeyDown={onKey}
          className={cn("animate-rise absolute z-30 mt-1 min-w-48 rounded-md border border-border bg-bg p-1 shadow-pop", align === "right" ? "right-0" : "left-0")}>
          {items.map((it) => (
            <button key={it.label} role="menuitem" type="button" disabled={it.disabled}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); it.onSelect(); }}
              className={cn("flex w-full items-center gap-2 rounded px-2.5 py-2 text-sm text-left hover:bg-surface focus:bg-surface focus:outline-none disabled:opacity-50",
                it.danger ? "text-danger" : "text-text")}>
              {it.icon}{it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
