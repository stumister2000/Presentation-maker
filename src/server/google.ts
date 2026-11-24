import "server-only";
import { appUrl } from "./email";

// Google sign-in (OpenID Connect, authorization code + PKCE) with the owner's
// own OAuth client (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). Scopes: openid
// email profile only - no sensitive scopes, so no Google verification review.

export const googleEnabled = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const redirectUri = () => `${appUrl()}/api/auth/google/callback`;

export function authorizeUrl(state: string, challenge: string): string {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  u.searchParams.set("redirect_uri", redirectUri());
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", state);
  u.searchParams.set("code_challenge", challenge);
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("prompt", "select_account");
  return u.toString();
}

export interface GoogleProfile { sub: string; email: string; emailVerified: boolean; name: string }

/** Exchanges the code at Google's token endpoint. The ID token comes straight from Google over TLS. */
export async function exchangeCode(code: string, verifier: string): Promise<GoogleProfile> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, code_verifier: verifier, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(), grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`google token endpoint ${res.status}`);
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error("no id_token");
  const payload = JSON.parse(Buffer.from(id_token.split(".")[1], "base64url").toString("utf8")) as Record<string, unknown>;
  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error("audience mismatch");
  if (payload.iss !== "https://accounts.google.com" && payload.iss !== "accounts.google.com") throw new Error("issuer mismatch");
  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) throw new Error("expired id token");
  return { sub: String(payload.sub), email: String(payload.email ?? "").toLowerCase(), emailVerified: payload.email_verified === true, name: String(payload.name ?? "") };
}
