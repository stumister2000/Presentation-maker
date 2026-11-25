import { test, expect, request as pwRequest } from "@playwright/test";
import { generateDeckApi, ndjson, signUpApi } from "./helpers";

test.describe("access rules", () => {
  test("a private deck is not visible by slug; a shared one is", async ({ baseURL, page }) => {
    const a = await pwRequest.newContext({ baseURL });
    await signUpApi(a);
    const { deckId } = await generateDeckApi(a);
    const deck = await (await a.get(`/api/decks/${deckId}`)).json();
    await page.goto(`/p/${deck.slug}`);
    await expect(page.getByRole("heading", { name: "This deck is not available" })).toBeVisible();
    await a.patch(`/api/decks/${deckId}`, { data: { linkAccess: "view" } });
    await page.goto(`/p/${deck.slug}`);
    await expect(page.getByRole("button", { name: "Present" })).toBeVisible();
  });

  test("cross-site writes are blocked", async ({ baseURL }) => {
    const a = await pwRequest.newContext({ baseURL });
    await signUpApi(a);
    const res = await a.post("/api/decks", { data: { title: "x" }, headers: { origin: "https://evil.example" } });
    expect(res.status()).toBe(403);
  });
});

test.describe("jobs", () => {
  test("daily cron needs the secret", async ({ baseURL }) => {
    const anon = await pwRequest.newContext({ baseURL });
    expect((await anon.get("/api/cron/daily")).status()).toBe(401);
    const ok = await anon.get("/api/cron/daily", { headers: { authorization: "Bearer test-cron-secret" } });
    expect(ok.status()).toBe(200);
    expect((await ok.json()).ok).toBe(true);
  });
});

test.describe("claude engine (mock API)", () => {
  const CLAUDE = "http://localhost:3201";

  test("outline and cards stream through the SDK; bad lines are dropped", async () => {
    const api = await pwRequest.newContext({ baseURL: CLAUDE });
    await signUpApi(api);
    const { deckId, outline, events } = await generateDeckApi(api, "", "A talk about bees", 3);
    expect(outline.map((o) => (o as { title: string }).title)).toEqual(["Mock title card", "Mock point 1", "Mock point 2"]);
    const cards = events.filter((e) => e.type === "card");
    expect(cards).toHaveLength(3);
    expect(events.at(-1)?.type).toBe("done");
    const deck = await (await api.get(`/api/decks/${deckId}`)).json();
    expect(deck.cards[0].content[0].text).toBe("Mock card 1");

    const mock = await (await pwRequest.newContext()).get("http://localhost:3299/last");
    const last = await mock.json();
    expect(last.body.model).toBe("claude-opus-5-5");
    expect(last.body.fallbacks).toBe("default");
    expect(last.body.output_config.effort).toBe("medium");
    expect(String(last.headers["anthropic-beta"])).toContain("server-side-fallback-2026-07-01");
    expect(last.body.messages[0].content).toContain("<user_material>");
    // design notes reach the model, fenced as data
    await api.post("/api/generate/outline", { data: { source: "prompt", input: "Bees", settings: { numCards: 2, designNotes: "One idea per card. No bullets." } } }).then((r) => r.body());
    const notesReq = await (await (await pwRequest.newContext()).get("http://localhost:3299/last")).json();
    expect(notesReq.body.system).toContain("<design_notes>One idea per card. No bullets.</design_notes>");
  });

  test("AI edit returns edited cards with the same ids", async () => {
    const api = await pwRequest.newContext({ baseURL: CLAUDE });
    await signUpApi(api);
    const { deckId } = await generateDeckApi(api, "", "A talk about bees", 2);
    const deck = await (await api.get(`/api/decks/${deckId}`)).json();
    const res = await api.post("/api/ai/edit", { data: { deckId, cardId: deck.cards[1].id, instruction: "make it punchier" } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.cards).toHaveLength(1);
    expect(body.cards[0].id).toBe(deck.cards[1].id);
    expect(body.cards[0].content[0].text).toBe("Edited by mock");
  });
});

test("ndjson helper sanity", () => {
  expect(ndjson('{"a":1}\n{"b":2}\n')).toEqual([{ a: 1 }, { b: 2 }]);
});
