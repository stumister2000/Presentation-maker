import "server-only";
import { randomBytes } from "node:crypto";
import { q } from "./db";

// No sign-in: the app runs as one built-in local user, created on first use.
// Every deck belongs to this user, so the data layer is unchanged.

const LOCAL_EMAIL = "local@fairdeck.local";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

const g = globalThis as unknown as { __localUser?: Promise<SessionUser> };

async function loadLocalUser(): Promise<SessionUser> {
  const find = () => q<{ id: string; email: string; name: string }>`select id, email, name from users where lower(email) = ${LOCAL_EMAIL}`;
  let [u] = await find();
  if (!u) {
    await q`insert into users (email, name, credits) values (${LOCAL_EMAIL}, 'You', 0) on conflict do nothing`;
    [u] = await find();
  }
  return u;
}

export async function currentUser(): Promise<SessionUser> {
  g.__localUser ??= loadLocalUser().catch((e) => { g.__localUser = undefined; throw e; });
  return g.__localUser;
}

export const requireUser = currentUser;

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}
