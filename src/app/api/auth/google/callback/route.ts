import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { startSession } from "@/server/auth";
import { exchangeCode, googleEnabled } from "@/server/google";
import { tx } from "@/server/db";
import { SIGNUP_CREDITS } from "@/server/queries";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const state = jar.get("g_state")?.value, verifier = jar.get("g_verifier")?.value;
  jar.delete("g_state"); jar.delete("g_verifier");
  const fail = () => NextResponse.redirect(new URL("/login?error=google", url));
  if (!googleEnabled() || !state || !verifier || url.searchParams.get("state") !== state || !url.searchParams.get("code")) return fail();
  try {
    const g = await exchangeCode(url.searchParams.get("code")!, verifier);
    if (!g.email || !g.emailVerified) return fail();
    const userId = await tx(async (t) => {
      const bySub = await t<{ id: string }>`select id from users where google_sub = ${g.sub}`;
      if (bySub[0]) return bySub[0].id;
      // link to an existing account with the same verified email, or create one
      const byEmail = await t<{ id: string }>`update users set google_sub = ${g.sub}, email_verified_at = coalesce(email_verified_at, now()) where lower(email) = ${g.email} returning id`;
      if (byEmail[0]) return byEmail[0].id;
      const [u] = await t<{ id: string }>`insert into users (email, name, google_sub, email_verified_at, credits) values (${g.email}, ${g.name.slice(0, 80)}, ${g.sub}, now(), ${SIGNUP_CREDITS}) returning id`;
      await t`insert into credit_ledger (user_id, delta, reason) values (${u.id}, ${SIGNUP_CREDITS}, 'signup')`;
      return u.id;
    });
    await startSession(userId);
    return NextResponse.redirect(new URL("/home", url));
  } catch (e) {
    console.error("google sign-in failed", String(e).slice(0, 200));
    return fail();
  }
}
