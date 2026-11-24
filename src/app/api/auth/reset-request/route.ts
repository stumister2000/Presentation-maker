import { z } from "zod";
import { route, body, rateLimit } from "@/server/http";
import { issueToken } from "@/server/auth";
import { appUrl, emails, sendEmail } from "@/server/email";
import { findUserByEmail } from "@/server/queries";

/** Always answers ok, so the form cannot be used to find out who has an account. */
export const POST = route(async (req) => {
  const { email } = await body(req, z.object({ email: z.string().trim().toLowerCase().email().max(254) }));
  rateLimit(`reset:${email}`, 3, 15 * 60_000);
  const u = await findUserByEmail(email);
  if (u) {
    const token = await issueToken(u.id, "password_reset");
    await sendEmail({ to: email, ...emails.reset(`${appUrl()}/reset?token=${token}`) });
  }
  return { ok: true };
});
