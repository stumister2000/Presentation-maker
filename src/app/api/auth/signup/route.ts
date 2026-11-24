import { z } from "zod";
import { route, body, rateLimit } from "@/server/http";
import { hashPassword, issueToken, startSession } from "@/server/auth";
import { appUrl, emails, sendEmail } from "@/server/email";
import { createUser } from "@/server/queries";

const Schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, "Use at least 8 characters.").max(200),
  name: z.string().trim().max(80).default(""),
});

export const POST = route(async (req) => {
  rateLimit(`signup:${req.headers.get("x-forwarded-for") ?? "local"}`, 10, 60 * 60_000);
  const { email, password, name } = await body(req, Schema);
  const id = await createUser(email, name, await hashPassword(password));
  await startSession(id);
  const token = await issueToken(id, "verify_email");
  // do not fail sign-up if the email provider hiccups; they can request another link later
  await sendEmail({ to: email, ...emails.verify(`${appUrl()}/auth/verify?kind=verify&token=${token}`) }).catch((e) => console.error("verify email failed", String(e)));
  return { id };
});
