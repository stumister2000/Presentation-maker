import { z } from "zod";
import { route, body, rateLimit } from "@/server/http";
import { issueToken } from "@/server/auth";
import { appUrl, emails, sendEmail } from "@/server/email";
import { q } from "@/server/db";
import { SIGNUP_CREDITS } from "@/server/queries";

/** Email a one-time sign-in link. Creates the account on first use. Same answer either way. */
export const POST = route(async (req) => {
  const { email } = await body(req, z.object({ email: z.string().trim().toLowerCase().email().max(254) }));
  rateLimit(`magic:${email}`, 3, 15 * 60_000);
  rateLimit(`magic-ip:${req.headers.get("x-forwarded-for") ?? "local"}`, 10, 60 * 60_000);
  let [u] = await q<{ id: string }>`select id from users where lower(email) = ${email}`;
  if (!u) {
    [u] = await q<{ id: string }>`insert into users (email, credits) values (${email}, ${SIGNUP_CREDITS}) returning id`;
    await q`insert into credit_ledger (user_id, delta, reason) values (${u.id}, ${SIGNUP_CREDITS}, 'signup')`;
  }
  const token = await issueToken(u.id, "magic_link");
  await sendEmail({ to: email, ...emails.magic(`${appUrl()}/auth/verify?kind=magic&token=${token}`) });
  return { ok: true };
});
