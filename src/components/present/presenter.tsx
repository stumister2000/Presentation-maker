"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, StickyNote, Maximize } from "lucide-react";
import { ScaledCard } from "@/components/deck/scaled-card";
import { cardTitle, type Card } from "@/lib/blocks";
import { themeStyle, type DeckTheme } from "@/lib/themes";
import { cn } from "@/lib/cn";

/** Full-screen slideshow. Arrows / Space / PageUp / PageDown / Home / End. N toggles notes. Esc exits. */
export function Presenter({ cards, theme, start = 0, onExit, showNotes: allowNotes = true }: {
  cards: Card[]; theme: DeckTheme; start?: number; onExit: () => void; showNotes?: boolean;
}) {
  const [i, setI] = useState(Math.min(start, cards.length - 1));
  const [notes, setNotes] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const go = useCallback((n: number) => setI(Math.max(0, Math.min(cards.length - 1, n))), [cards.length]);

  useEffect(() => {
    root.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); setI((x) => Math.min(cards.length - 1, x + 1)); }
      else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(cards.length - 1);
      else if (e.key === "Escape") onExit();
      else if ((e.key === "n" || e.key === "N") && allowNotes) setNotes((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards.length, go, onExit, allowNotes]);

  useEffect(() => {
    const onFs = () => { if (!document.fullscreenElement) { /* leaving fullscreen keeps the overlay; Esc closes it */ } };
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, []);

  const card = cards[i];
  return (
    <div ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`Presenting, card ${i + 1} of ${cards.length}`}
      className="deck-root fixed inset-0 z-[70] flex flex-col outline-none" style={themeStyle(theme)} data-testid="presenter">
      <div className="absolute top-0 inset-x-0 h-1 bg-[color-mix(in_srgb,var(--deck-text)_12%,transparent)]">
        <div className="h-full bg-[var(--deck-accent)] transition-[width] duration-300" style={{ width: `${((i + 1) / cards.length) * 100}%` }} />
      </div>
      <div className="flex-1 min-h-0 flex">
        <div className="relative flex-1 min-w-0 p-[2vmin]">
          <ScaledCard key={card.id} card={card} theme={theme} fit="contain" fixedRatio={false} className="h-full w-full !bg-transparent animate-rise" />
          <button type="button" aria-label="Previous card" className="absolute inset-y-0 left-0 w-1/4 cursor-w-resize opacity-0" onClick={() => go(i - 1)} tabIndex={-1} />
          <button type="button" aria-label="Next card" className="absolute inset-y-0 right-0 w-1/4 cursor-e-resize opacity-0" onClick={() => go(i + 1)} tabIndex={-1} />
        </div>
        {notes && (
          <aside className="w-[min(340px,40vw)] shrink-0 bg-[var(--deck-card)] text-[var(--deck-text)] p-5 overflow-y-auto border-l border-[color-mix(in_srgb,var(--deck-text)_12%,transparent)]" aria-label="Speaker notes">
            <h2 className="text-sm font-semibold mb-2 opacity-70">Notes</h2>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{card.notes || "No notes for this card."}</p>
            {cards[i + 1] && <p className="mt-6 text-sm opacity-60">Next: {cardTitle(cards[i + 1])}</p>}
          </aside>
        )}
      </div>
      <div className="flex items-center gap-1 px-3 py-2 text-[var(--deck-text)]">
        <PBtn label="Exit (Esc)" onClick={onExit}><X size={18} /></PBtn>
        <PBtn label="Previous" onClick={() => go(i - 1)} disabled={i === 0}><ChevronLeft size={18} /></PBtn>
        <span className="text-sm tabular-nums px-1" aria-live="polite">{i + 1} / {cards.length}</span>
        <PBtn label="Next" onClick={() => go(i + 1)} disabled={i === cards.length - 1}><ChevronRight size={18} /></PBtn>
        <div className="ml-auto flex gap-1">
          {allowNotes && <PBtn label="Speaker notes (N)" onClick={() => setNotes((v) => !v)} active={notes}><StickyNote size={18} /></PBtn>}
          <PBtn label="Full screen" onClick={() => document.fullscreenElement ? void document.exitFullscreen() : void root.current?.requestFullscreen?.().catch(() => {})}><Maximize size={18} /></PBtn>
        </div>
      </div>
    </div>
  );
}

function PBtn({ label, onClick, children, disabled, active }: { label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean; active?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      className={cn("rounded-md p-2 hover:bg-[color-mix(in_srgb,var(--deck-text)_10%,transparent)] disabled:opacity-30", active && "bg-[color-mix(in_srgb,var(--deck-text)_12%,transparent)]")}>
      {children}
    </button>
  );
}
