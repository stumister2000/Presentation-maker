import { z } from "zod";
import { route, body, ndjson } from "@/server/http";
import { requireUser } from "@/server/auth";
import { InputSchema, OutlineSchema, clampSettings } from "@/server/gen-input";
import { getEngine } from "@/server/ai";
import { localEngine } from "@/server/ai/local";
import { decorateCard } from "@/server/images";
import { appendCard, createDeck, createGeneration, finishGeneration, updateDeck } from "@/server/queries";

export const maxDuration = 300;

// free = lay out the outline as written, without AI writing
const Schema = InputSchema.extend({ outline: OutlineSchema, title: z.string().trim().max(200).optional(), free: z.boolean().default(false) });

export const POST = route(async (req) => {
  const u = await requireUser();
  const { source, input, settings, outline: rawOutline, title, free } = await body(req, Schema);
  const s = clampSettings(settings);
  const outline = rawOutline.slice(0, s.numCards);
  s.numCards = outline.length;
  const genId = await createGeneration(u.id, { source, inputText: input, settings: s });
  const engine = free ? localEngine : await getEngine();
  const deckTitle = title || outline[0].title;
  const deckId = await createDeck(u.id, { title: deckTitle, themeId: s.themeId, format: s.format, cards: [] });

  return ndjson(async (send) => {
    send({ type: "deck", id: deckId });
    let made = 0;
    try {
      for await (const raw of engine.cards(outline, s, input)) {
        const card = await decorateCard(raw, s, deckTitle);
        await appendCard(u.id, deckId, card);
        send({ type: "card", index: made++, card });
        if (made >= outline.length) break;
      }
      if (made === 0) throw new Error("engine produced no cards");
      await finishGeneration(genId, "completed", { deckId, outline });
      send({ type: "done" });
    } catch (e) {
      await finishGeneration(genId, "failed", { deckId, error: String(e).slice(0, 500) });
      if (made === 0) await updateDeck(u.id, deckId, { archived: true });
      throw e;
    }
  });
});
