import { z } from "zod";
import { route, body, rateLimit } from "@/server/http";
import { consumeToken, endAllSessions, hashPassword, HttpError, startSession } from "@/server/auth";
import { q } from "@/server/db";

export const POST = route(async (req) => {
  rateLimit(`reset-use:${req.headers.get("x-forwarded-for") ?? "local"}`, 10, 15 * 60_000);
  const { token, password } = await body(req, z.object({ token: z.string().min(10).max(200), password: z.string().min(8, "Use at least 8 characters.").max(200) }));
  const userId = await consumeToken(token, "password_reset");
  if (!userId) throw new HttpError(400, "This reset link has expired or was already used. Ask for a new one.", "bad_token");
  await q`update users set password_hash = ${await hashPassword(password)}, email_verified_at = coalesce(email_verified_at, now()), updated_at = now() where id = ${userId}`;
  await endAllSessions(userId); // a reset signs out every other device
  await startSession(userId);
  return { ok: true };
});
