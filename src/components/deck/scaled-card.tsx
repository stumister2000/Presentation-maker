"use client";
import { useLayoutEffect, useRef, useState } from "react";
import type { Card } from "@/lib/blocks";
import type { DeckTheme } from "@/lib/themes";
import { themeStyle } from "@/lib/themes";
import { CardView } from "./card-view";
import { cn } from "@/lib/cn";

export const BASE_WIDTH = 960;

/**
 * Renders a card at a fixed design width (960px, 18px type) and scales it to
 * its container. fit="width" fills the width (thumbnails); fit="contain" fits
 * the whole card, however tall, inside the box (present mode).
 */
export function ScaledCard({ card, theme, className, fit = "width", fixedRatio = true }: {
  card: Card; theme: DeckTheme; className?: string; fit?: "width" | "contain"; fixedRatio?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [{ scale, top }, setBox] = useState({ scale: 0, top: 0 });
  useLayoutEffect(() => {
    const el = box.current, inn = inner.current;
    if (!el || !inn) return;
    const measure = () => {
      const ih = inn.offsetHeight || BASE_WIDTH * 9 / 16;
      const w = el.clientWidth / BASE_WIDTH;
      const sc = fit === "contain" ? Math.min(w, el.clientHeight / ih) : w;
      setBox({ scale: sc, top: fit === "contain" ? Math.max(0, (el.clientHeight - ih * sc) / 2) : 0 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(inn);
    return () => ro.disconnect();
  }, [fit]);
  return (
    <div ref={box} className={cn("deck-root relative overflow-hidden", className)} style={themeStyle(theme)} aria-hidden={fit === "width" || undefined}>
      <div ref={inner} className="absolute left-1/2 origin-top text-[18px]"
        style={{ width: BASE_WIDTH, top, transform: `translateX(-50%) scale(${scale})`, visibility: scale ? "visible" : "hidden" }}>
        <CardView card={card} theme={theme} fixedRatio={fixedRatio} className={fit === "width" ? "!rounded-none !shadow-none" : undefined} />
      </div>
    </div>
  );
}
