import { z } from "zod";
import { route, body } from "@/server/http";
import { requireUser } from "@/server/auth";
import { deleteDeckForever, getDeck, updateDeck } from "@/server/queries";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req, { params }: Ctx) => {
  const u = await requireUser();
  return getDeck(u.id, (await params).id);
});

const Patch = z.object({
  title: z.string().trim().max(200).optional(),
  themeId: z.string().max(40).optional(),
  isFavorite: z.boolean().optional(),
  archived: z.boolean().optional(),
  linkAccess: z.enum(["none", "view"]).optional(),
  dimensions: z.enum(["fluid", "16x9", "4x3"]).optional(),
  textScale: z.enum(["s", "m", "l", "xl"]).optional(),
});

export const PATCH = route(async (req, { params }: Ctx) => {
  const u = await requireUser();
  const { id } = await params;
  await updateDeck(u.id, id, await body(req, Patch));
  return getDeck(u.id, id);
});

export const DELETE = route(async (_req, { params }: Ctx) => {
  const u = await requireUser();
  await deleteDeckForever(u.id, (await params).id);
  return null;
});
