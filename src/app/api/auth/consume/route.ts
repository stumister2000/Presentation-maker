import { z } from "zod";
import { route, body, rateLimit } from "@/server/http";
import { consumeToken, HttpError, startSession } from "@/server/auth";
import { q } from "@/server/db";

/** Consumes a magic-link or verify-email token (POST, so link scanners cannot burn it). */
export const POST = route(async (req) => {
  rateLimit(`consume:${req.headers.get("x-forwarded-for") ?? "local"}`, 20, 15 * 60_000);
  const { token, kind } = await body(req, z.object({ token: z.string().min(10).max(200), kind: z.enum(["magic", "verify"]) }));
  const userId = await consumeToken(token, kind === "verify" ? "verify_email" : "magic_link");
  if (!userId) throw new HttpError(400, "This link has expired or was already used.", "bad_token");
  await q`update users set email_verified_at = coalesce(email_verified_at, now()) where id = ${userId}`;
  await startSession(userId);
  return { next: kind === "verify" ? "/home?verified=1" : "/home" };
});
