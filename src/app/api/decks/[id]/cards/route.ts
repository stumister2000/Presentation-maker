import { z } from "zod";
import { route, body } from "@/server/http";
import { requireUser } from "@/server/auth";
import { saveCards } from "@/server/queries";
import { sanitizeCard, type Card } from "@/lib/blocks";

const Save = z.object({ cards: z.array(z.unknown()).max(200) });

export const PUT = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const u = await requireUser();
  const { cards } = await body(req, Save);
  const clean = cards.map(sanitizeCard).filter(Boolean) as Card[];
  const updatedAt = await saveCards(u.id, (await params).id, clean);
  return { updatedAt };
});
