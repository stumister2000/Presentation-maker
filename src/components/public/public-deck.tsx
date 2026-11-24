"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { CardView } from "@/components/deck/card-view";
import { Presenter } from "@/components/present/presenter";
import type { Card } from "@/lib/blocks";
import { getTheme, themeStyle } from "@/lib/themes";
import { APP_NAME } from "@/lib/brand";

export function PublicDeck({ slug, title, cards, themeId, watermark, embed }: {
  slug: string; title: string; cards: Card[]; themeId: string; watermark: boolean; embed: boolean; firstTitle: string;
}) {
  const theme = getTheme(themeId);
  const [presenting, setPresenting] = useState<number | null>(null);
  const seen = useRef(new Set<number>());
  const started = useRef(Date.now());

  // privacy-light analytics: how many cards were seen and for how long, keyed by a random cookie
  useEffect(() => {
    const send = () => {
      const body = JSON.stringify({ slug, cardsSeen: seen.current.size, seconds: Math.round((Date.now() - started.current) / 1000) });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/views", new Blob([body], { type: "application/json" }));
      else void fetch("/api/views", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) seen.current.add(Number((e.target as HTMLElement).dataset.index)); }), { threshold: 0.5 });
    document.querySelectorAll("[data-pcard]").forEach((el) => io.observe(el));
    const first = setTimeout(send, 3000);
    const every = setInterval(send, 30000);
    const onHide = () => { if (document.visibilityState === "hidden") send(); };
    document.addEventListener("visibilitychange", onHide);
    return () => { io.disconnect(); clearTimeout(first); clearInterval(every); document.removeEventListener("visibilitychange", onHide); };
  }, [slug]);

  useEffect(() => { if (presenting !== null) seen.current.add(presenting); }, [presenting]);

  return (
    <div className="deck-root min-h-dvh" style={themeStyle(theme)}>
      {!embed && (
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4 sm:px-6 h-14 backdrop-blur bg-[color-mix(in_srgb,var(--deck-page)_80%,transparent)]">
          <h1 className="font-semibold truncate text-[var(--deck-text)]" style={{ fontFamily: "var(--deck-heading-font)" }}>{title}</h1>
          <button type="button" onClick={() => setPresenting(0)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md px-3 h-9 text-sm font-semibold bg-[var(--deck-accent)] text-[var(--deck-card)]">
            <Play size={15} aria-hidden="true" />Present
          </button>
        </header>
      )}
      <main className="mx-auto max-w-[var(--layout-card-max)] px-3 sm:px-6 py-6 flex flex-col gap-8 text-[clamp(12px,1.75vw,18px)]">
        {cards.map((c, i) => (
          <section key={c.id} data-pcard data-index={i} aria-label={`Card ${i + 1}`}><CardView card={c} theme={theme} /></section>
        ))}
      </main>
      {watermark && (
        <Link href="/" className="fixed bottom-4 right-4 rounded-pill bg-text text-bg text-xs font-semibold px-3 py-1.5 shadow-pop">Made with {APP_NAME}</Link>
      )}
      {presenting !== null && <Presenter cards={cards} theme={theme} start={presenting} onExit={() => setPresenting(null)} showNotes={false} />}
    </div>
  );
}
