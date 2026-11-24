"use client";
import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

const base =
  "w-full rounded-md border border-border-input bg-bg px-3 text-base text-text placeholder:text-text-muted " +
  "focus:outline-none focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-50 aria-[invalid=true]:border-danger";

interface FieldShell {
  label: string;
  hideLabel?: boolean;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & FieldShell>(
  function TextField({ label, hideLabel, error, hint, className, id, ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fid} className={cn("text-sm font-semibold", hideLabel && "sr-only")}>{label}</label>
        <input
          ref={ref}
          id={fid}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined}
          className={cn(base, "h-10", className)}
          {...rest}
        />
        {hint && !error && <p id={`${fid}-hint`} className="text-xs text-text-muted">{hint}</p>}
        {error && <p id={`${fid}-err`} className="text-sm text-danger">{error}</p>}
      </div>
    );
  },
);

export const TextArea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldShell & { prompt?: boolean }>(
  function TextArea({ label, hideLabel, error, hint, prompt, className, id, ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fid} className={cn("text-sm font-semibold", hideLabel && "sr-only")}>{label}</label>
        <textarea
          ref={ref}
          id={fid}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-err` : undefined}
          className={cn(base, "py-2.5 resize-y", prompt && "rounded-xl p-4 text-lg shadow-card min-h-32", className)}
          {...rest}
        />
        {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
        {error && <p id={`${fid}-err`} className="text-sm text-danger">{error}</p>}
      </div>
    );
  },
);

export function Select({
  label, hideLabel, options, className, id, ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; hideLabel?: boolean; options: Array<{ value: string; label: string }> }) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fid} className={cn("text-sm font-semibold", hideLabel && "sr-only")}>{label}</label>
      <select id={fid} className={cn(base, "h-10 pr-8", className)} {...rest}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
