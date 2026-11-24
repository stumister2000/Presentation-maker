import { z } from "zod";
import { cookies } from "next/headers";
import { route, body, rateLimit } from "@/server/http";
import { randomToken } from "@/server/auth";
import { recordView } from "@/server/queries";

const View = z.object({ slug: z.string().max(40), cardsSeen: z.number().int().min(0).max(500), seconds: z.number().int().min(0).max(21600) });

export const POST = route(async (req) => {
  const v = await body(req, View);
  const jar = await cookies();
  let key = jar.get("vk")?.value;
  if (!key || key.length > 40) {
    key = randomToken(12);
    jar.set("vk", key, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365, secure: process.env.NODE_ENV === "production" });
  }
  rateLimit(`view:${key}`, 60, 60_000);
  await recordView(v.slug, key, v.cardsSeen, v.seconds);
  return null;
});
