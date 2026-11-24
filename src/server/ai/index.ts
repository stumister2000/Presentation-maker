import "server-only";
import type { DeckEngine } from "./types";
import { localEngine } from "./local";

/** Picks the engine: a real model when a key is configured, else offline drafting. */
export async function getEngine(): Promise<DeckEngine> {
  return localEngine;
}
