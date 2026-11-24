import "server-only";
import type { Card } from "@/lib/blocks";
import type { GenSettings } from "@/lib/generation";

/** Adds a photo to cards that have an image slot, when a stock source is configured. */
export async function decorateCard(card: Card, s: GenSettings, _topic: string): Promise<Card> {
  if (s.imageSource === "none") return { ...card, layout: "none", imageUrl: null };
  return card; // "art" is drawn at render time from the theme; stock photos are added by the backend stage
}
