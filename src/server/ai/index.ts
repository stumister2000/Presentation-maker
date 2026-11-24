import "server-only";
import type { DeckEngine } from "./types";
import { localEngine } from "./local";

/**
 * AI_ENGINE=claude forces the Claude engine, AI_ENGINE=offline forces the
 * offline drafting engine. Unset: Claude when ANTHROPIC_API_KEY is present.
 */
export async function getEngine(): Promise<DeckEngine> {
  const pick = process.env.AI_ENGINE ?? (process.env.ANTHROPIC_API_KEY ? "claude" : "offline");
  if (pick === "claude") return (await import("./claude")).claudeEngine;
  return localEngine;
}

export function engineName(): "claude" | "offline" {
  return (process.env.AI_ENGINE ?? (process.env.ANTHROPIC_API_KEY ? "claude" : "offline")) === "claude" ? "claude" : "offline";
}
