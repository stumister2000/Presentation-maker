import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const uniqueEmail = (tag: string) => `${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

/** No sign-in any more: kept so specs read the same. */
export async function signUpApi(_request: APIRequestContext, _base = "") {
  return "";
}

/** No sign-in any more: just opens the create screen. */
export async function signUpUi(page: Page) {
  await page.goto("/create/generate");
  return "";
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

