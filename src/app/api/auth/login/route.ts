import { z } from "zod";
import { route, body, rateLimit } from "@/server/http";
import { HttpError, startSession, verifyPassword } from "@/server/auth";
import { findUserByEmail } from "@/server/queries";

const Schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) });

export const POST = route(async (req) => {
  const { email, password } = await body(req, Schema);
  rateLimit(`login:${email}`, 10, 15 * 60_000);
  const u = await findUserByEmail(email);
  // same message and similar timing whether or not the account exists
  const ok = await verifyPassword(password, u?.password_hash ?? "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
  if (!u || !ok) throw new HttpError(401, "That email and password do not match.", "bad_credentials");
  await startSession(u.id);
  return { id: u.id };
});
