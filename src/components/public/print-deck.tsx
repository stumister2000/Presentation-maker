"use client";
import { useEffect } from "react";
import { Printer } from "lucide-react";
import { CardView } from "@/components/deck/card-view";
import { Button } from "@/components/ui/button";
import type { Card } from "@/lib/blocks";
import { getTheme, themeStyle, withScale } from "@/lib/themes";

/** Each card on its own 16:9 page. The browser's "Save as PDF" makes the file. */
export function PrintDeck({ title, cards, themeId, textScale }: { title: string; cards: Card[]; themeId: string; textScale: string }) {
  const theme = withScale(getTheme(themeId), textScale);
  useEffect(() => {
    const t = setTimeout(() => { void document.fonts.ready.then(() => window.print()); }, 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="deck-root min-h-dvh" style={themeStyle(theme)}>
      <div className="no-print sticky top-0 z-10 flex items-center gap-3 bg-bg border-b border-border px-4 h-14 text-text">
        <span className="font-semibold truncate">{title}</span>
        <span className="text-sm text-text-muted hidden sm:inline">In the print dialog choose “Save as PDF”, landscape, no margins.</span>
        <Button variant="primary" size="sm" className="ml-auto" onClick={() => window.print()}><Printer size={16} />Print / Save PDF</Button>
      </div>
      <div className="flex flex-col items-center gap-6 py-6 print:p-0 print:gap-0">
        {cards.map((c) => (
          <div key={c.id} className="print-card w-[1280px] max-w-full" style={{ fontSize: "calc(24px * var(--deck-scale, 1))" }}>
            <CardView card={c} theme={theme} fixedRatio className="print:!rounded-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
