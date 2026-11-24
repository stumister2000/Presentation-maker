import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

export const OUTBOX = path.join(process.cwd(), "test-results", "outbox.jsonl");

export const uniqueEmail = (tag: string) => `${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

export async function signUpApi(request: APIRequestContext, base = "", email = uniqueEmail("u")) {
  const res = await request.post(`${base}/api/auth/signup`, { data: { email, password: "password123", name: "Test Person" } });
  expect(res.status()).toBe(200);
  return email;
}

export async function signUpUi(page: Page, email = uniqueEmail("ui")) {
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Test Person");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/create/generate**");
  return email;
}

/** Reads NDJSON from a streaming endpoint response body. */
export function ndjson(text: string): Array<Record<string, unknown>> {
  return text.split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

export async function generateDeckApi(request: APIRequestContext, base = "", input = "A pitch for a community composting service", numCards = 4) {
  const settings = { numCards };
  const o = await request.post(`${base}/api/generate/outline`, { data: { source: "prompt", input, settings } });
  expect(o.status()).toBe(200);
  const outline = ndjson(await o.text()).filter((e) => e.type === "outline").map((e) => e.item);
  const d = await request.post(`${base}/api/generate/deck`, { data: { source: "prompt", input, settings, outline } });
  expect(d.status()).toBe(200);
  const events = ndjson(await d.text());
  const deckId = events.find((e) => e.type === "deck")?.id as string;
  return { deckId, outline, events };
}

export function lastEmailTo(email: string, file = OUTBOX): { subject: string; text: string } | null {
  if (!existsSync(file)) return null;
  const mails = readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((m) => m.to === email);
  return mails.at(-1) ?? null;
}

export const tokenFrom = (text: string) => /token=([A-Za-z0-9_-]+)/.exec(text)?.[1] ?? "";
