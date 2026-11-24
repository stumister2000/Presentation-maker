"use client";
import { Check } from "lucide-react";
import { THEMES, themeStyle } from "@/lib/themes";
import { cn } from "@/lib/cn";

export function ThemeSwatch({ themeKey, selected, onSelect }: { themeKey: string; selected: boolean; onSelect: () => void }) {
  const t = THEMES.find((x) => x.key === themeKey)!;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn("group text-left rounded-lg p-1.5 border-2", selected ? "border-accent" : "border-transparent hover:border-border")}
    >
      <div className="deck-root rounded-md p-2.5 relative" style={themeStyle(t)}>
        <div className="deck-card !shadow-none rounded-md px-3 py-2.5">
          <div className="text-lg font-semibold leading-none" style={{ fontFamily: "var(--deck-heading-font)" }}>Aa</div>
          <div className="mt-2 h-1.5 w-3/4 rounded-full bg-[var(--deck-muted)] opacity-50" />
          <div className="mt-1 h-1.5 w-1/3 rounded-full bg-[var(--deck-accent)]" />
        </div>
        {selected && (
          <span className="absolute top-1 right-1 rounded-full bg-accent text-on-accent p-0.5"><Check size={12} aria-hidden="true" /></span>
        )}
      </div>
      <div className="mt-1.5 px-0.5 text-sm font-medium">{t.name}</div>
    </button>
  );
}

export function ThemeGrid({ value, onChange, columns = 3 }: { value: string; onChange: (k: string) => void; columns?: number }) {
  return (
    <div role="radiogroup" aria-label="Theme" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
      {THEMES.map((t) => <ThemeSwatch key={t.key} themeKey={t.key} selected={t.key === value} onSelect={() => onChange(t.key)} />)}
    </div>
  );
}
