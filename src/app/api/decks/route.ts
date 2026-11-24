import { z } from "zod";
import { route, body } from "@/server/http";
import { requireUser } from "@/server/auth";
import { createDeck, listDecks } from "@/server/queries";
import { blankCard, sanitizeCard, type Card } from "@/lib/blocks";

export const GET = route(async (req) => {
  const u = await requireUser();
  const v = new URL(req.url).searchParams.get("view");
  const view = v === "favorites" || v === "trash" ? v : "all";
  return { decks: await listDecks(u.id, view) };
});

const Create = z.object({
  title: z.string().max(200).default("Untitled"),
  themeId: z.string().max(40).optional(),
  cards: z.array(z.unknown()).max(200).optional(),
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const input = await body(req, Create);
  const cards = (input.cards?.map(sanitizeCard).filter(Boolean) as Card[] | undefined) ?? [blankCard(input.title)];
  const id = await createDeck(u.id, { title: input.title, themeId: input.themeId, cards: cards.length ? cards : [blankCard(input.title)] });
  return { id };
});
