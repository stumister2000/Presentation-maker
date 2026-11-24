import { z } from "zod";
import { route, body } from "@/server/http";
import { requireUser, endSession } from "@/server/auth";
import { deleteUser, updateUserName } from "@/server/queries";
import { cancelAll } from "@/server/billing";

export const PATCH = route(async (req) => {
  const u = await requireUser();
  const { name } = await body(req, z.object({ name: z.string().trim().max(80) }));
  await updateUserName(u.id, name);
  return { ok: true };
});

export const DELETE = route(async (req) => {
  const u = await requireUser();
  const { confirm } = await body(req, z.object({ confirm: z.literal("DELETE") }));
  if (confirm) { await cancelAll(u.id); await endSession(); await deleteUser(u.id); }
  return null;
});
