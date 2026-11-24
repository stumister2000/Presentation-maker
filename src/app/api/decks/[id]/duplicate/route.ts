import { route } from "@/server/http";
import { requireUser } from "@/server/auth";
import { duplicateDeck } from "@/server/queries";

export const POST = route(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const u = await requireUser();
  return { id: await duplicateDeck(u.id, (await params).id) };
});
