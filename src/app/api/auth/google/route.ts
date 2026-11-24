import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { randomToken } from "@/server/auth";
import { authorizeUrl, googleEnabled } from "@/server/google";

export async function GET(req: Request) {
  if (!googleEnabled()) return NextResponse.redirect(new URL("/login?error=google", req.url));
  const state = randomToken(16), verifier = randomToken(48);
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const jar = await cookies();
  const opts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/api/auth/google", maxAge: 600 };
  jar.set("g_state", state, opts);
  jar.set("g_verifier", verifier, opts);
  return NextResponse.redirect(authorizeUrl(state, challenge));
}
