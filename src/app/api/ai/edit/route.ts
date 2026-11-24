import { z } from "zod";
import { route, body, rateLimit } from "@/server/http";
import { requireUser } from "@/server/auth";
import { getEngine } from "@/server/ai";
import { createGeneration, finishGeneration, getDeck, getUser, refundCredits } from "@/server/queries";
import { AI_EDIT_COST } from "@/lib/generation";
import { sanitizeCard, type Card } from "@/lib/blocks";

export const maxDuration = 120;

const Schema = z.object({
  deckId: z.string().uuid(),
  cardId: z.string().max(64).nullable().optional(),
  instruction: z.string().trim().min(2).max(1000),
});

export const POST = route(async (req) => {
  const u = await requireUser();
  rateLimit(`edit:${u.id}`, 10, 60_000);
  const { deckId, cardId, instruction } = await body(req, Schema);
  const deck = await getDeck(u.id, deckId);
  const targets = cardId ? deck.cards.filter((c) => c.id === cardId) : deck.cards;
  if (!targets.length) return { cards: [] };
  const genId = await createGeneration(u.id, { source: "ai_edit", inputText: instruction, settings: { cardId: cardId ?? null }, credits: AI_EDIT_COST, deckId });
  try {
    const engine = await getEngine();
    const edited = await engine.edit(targets, instruction, { deckTitle: deck.title });
    const cards = edited.map((c, i) => sanitizeCard({ ...c, id: targets[i]?.id ?? c.id })).filter(Boolean) as Card[];
    await finishGeneration(genId, "completed");
    return { cards, credits: (await getUser(u.id))?.credits };
  } catch (e) {
    await refundCredits(u.id, AI_EDIT_COST, genId);
    await finishGeneration(genId, "failed", { error: String(e).slice(0, 500) });
    throw e;
  }
});
