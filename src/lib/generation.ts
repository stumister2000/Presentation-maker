// Shared (client + server) generation settings and credit pricing.

export type TextMode = "generate" | "condense" | "preserve";
export type TextAmount = "brief" | "medium" | "detailed";
export type ImageSource = "art" | "stock" | "none";

export interface GenSettings {
  format: "presentation" | "document";
  numCards: number;
  language: string;
  textMode: TextMode;
  amount: TextAmount;
  tone: string;
  audience: string;
  imageSource: ImageSource;
  themeId: string;
  designNotes: string;
}

export interface OutlineItem {
  title: string;
  bullets: string[];
}

export const DEFAULT_SETTINGS: GenSettings = {
  format: "presentation",
  numCards: 8,
  language: "English",
  textMode: "generate",
  amount: "medium",
  tone: "",
  audience: "",
  imageSource: "art",
  themeId: "paper",
  designNotes: "",
};

export const LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese", "Italian", "Dutch", "Japanese", "Chinese (Simplified)", "Hindi"];

/** Credits: a flat base plus a little per card, so small decks are cheap. */
export function generationCost(numCards: number): number {
  return 10 + numCards * 3;
}
export const AI_EDIT_COST = 5;
export const MAX_INPUT_CHARS = 20000;

export type StreamEvent =
  | { type: "outline"; item: OutlineItem; index: number }
  | { type: "deck"; id: string }
  | { type: "card"; index: number; card: unknown }
  | { type: "done"; credits?: number }
  | { type: "error"; message: string; code?: string };

/** Reads an NDJSON response stream and calls onEvent for every complete line. */
export async function readStream(res: Response, onEvent: (e: StreamEvent) => void): Promise<void> {
  if (!res.body) throw new Error("No response body");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) onEvent(JSON.parse(line) as StreamEvent);
    }
  }
  if (buf.trim()) onEvent(JSON.parse(buf) as StreamEvent);
}
