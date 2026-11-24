import type { Card } from "@/lib/blocks";
import type { GenSettings, OutlineItem } from "@/lib/generation";

/** Anything that can turn input into an outline, an outline into cards, and edit cards. */
export interface DeckEngine {
  name: string;
  outline(input: string, source: "prompt" | "paste", settings: GenSettings): AsyncIterable<OutlineItem>;
  cards(outline: OutlineItem[], settings: GenSettings, topic: string): AsyncIterable<Card>;
  edit(cards: Card[], instruction: string, context: { deckTitle: string }): Promise<Card[]>;
}
