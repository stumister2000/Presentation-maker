import { test, expect, request as pwRequest } from "@playwright/test";
import Stripe from "stripe";
import { generateDeckApi, lastEmailTo, ndjson, signUpApi, tokenFrom, uniqueEmail } from "./helpers";

test.describe("access rules", () => {
  test("a second user gets nothing back from someone else's deck", async ({ baseURL }) => {
    const a = await pwRequest.newContext({ baseURL });
    const b = await pwRequest.newContext({ baseURL });
    await signUpApi(a);
    await signUpApi(b);
    const { deckId } = await generateDeckApi(a);
    expect(deckId).toBeTruthy();

    const checks = [
      b.get(`/api/decks/${deckId}`),
      b.patch(`/api/decks/${deckId}`, { data: { title: "hijacked" } }),
      b.put(`/api/decks/${deckId}/cards`, { data: { cards: [] } }),
      b.post(`/api/decks/${deckId}/duplicate`),
      b.get(`/api/decks/${deckId}/analytics`),
      b.post("/api/ai/edit", { data: { deckId, instruction: "make it shorter" } }),
    ];
    for (const res of await Promise.all(checks)) expect(res.status(), res.url()).toBe(404);
    const del = await b.delete(`/api/decks/${deckId}`);
    expect([404, 409]).toContain(del.status());
    expect((await (await b.get("/api/decks")).json()).decks).toHaveLength(0);

    // owner still sees it, untouched
    const own = await (await a.get(`/api/decks/${deckId}`)).json();
    expect(own.title).not.toBe("hijacked");
    expect(own.cards.length).toBeGreaterThan(0);
  });

  test("signed-out requests are refused", async ({ baseURL }) => {
    const anon = await pwRequest.newContext({ baseURL });
    expect((await anon.get("/api/decks")).status()).toBe(401);
    expect((await anon.post("/api/generate/outline", { data: {} })).status()).toBe(401);
    expect((await anon.get("/api/auth/me")).status()).toBe(401);
  });

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

test.describe("credits", () => {
  test("generation charges credits once and refuses when short", async ({ baseURL }) => {
    const a = await pwRequest.newContext({ baseURL });
    await signUpApi(a);
    expect((await (await a.get("/api/auth/me")).json()).credits).toBe(400);
    await generateDeckApi(a, "", "Topic", 4); // 10 + 4*3 = 22
    expect((await (await a.get("/api/auth/me")).json()).credits).toBe(378);
    // drain: 10 cards = 40 credits each time
    for (let i = 0; i < 9; i++) await generateDeckApi(a, "", "Topic", 10);
    const left = (await (await a.get("/api/auth/me")).json()).credits;
    expect(left).toBe(18);
    const outline = [{ title: "One", bullets: [] }, { title: "Two", bullets: [] }, { title: "Three", bullets: [] }];
    const res = await a.post("/api/generate/deck", { data: { source: "prompt", input: "Topic", settings: { numCards: 3 }, outline } });
    expect(res.status()).toBe(402);
    expect((await res.json()).code).toBe("out_of_credits");
    expect((await (await a.get("/api/auth/me")).json()).credits).toBe(18);
  });
});

test.describe("rate limits", () => {
  test("generation is limited per user per minute", async () => {
    const api = await pwRequest.newContext({ baseURL: "http://localhost:3201" });
    await signUpApi(api);
    const outline = [{ title: "One", bullets: [] }];
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const r = await api.post("/api/generate/deck", { data: { source: "prompt", input: "Topic", settings: { numCards: 1 }, outline } });
      statuses.push(r.status());
      await r.body();
    }
    expect(statuses.slice(0, 6).every((s) => s === 200)).toBe(true);
    expect(statuses[6]).toBe(429);
  });
});

test.describe("email flows", () => {
  test("sign-up sends a verification email that works once", async ({ baseURL }) => {
    const a = await pwRequest.newContext({ baseURL });
    const email = await signUpApi(a);
    const mail = lastEmailTo(email);
    expect(mail?.subject).toContain("Confirm your email");
    const token = tokenFrom(mail!.text);
    const ok = await a.post("/api/auth/consume", { data: { token, kind: "verify" } });
    expect(ok.status()).toBe(200);
    const again = await a.post("/api/auth/consume", { data: { token, kind: "verify" } });
    expect(again.status()).toBe(400);
  });

  test("magic link signs in, and creates the account the first time", async ({ baseURL }) => {
    const anon = await pwRequest.newContext({ baseURL });
    const email = uniqueEmail("magic");
    expect((await anon.post("/api/auth/magic", { data: { email } })).status()).toBe(200);
    const token = tokenFrom(lastEmailTo(email)!.text);
    expect((await anon.post("/api/auth/consume", { data: { token, kind: "magic" } })).status()).toBe(200);
    const me = await (await anon.get("/api/auth/me")).json();
    expect(me.email).toBe(email);
    expect(me.credits).toBe(400);
  });

  test("password reset works once, signs out other devices, and does not reveal accounts", async ({ baseURL }) => {
    const deviceA = await pwRequest.newContext({ baseURL });
    const email = await signUpApi(deviceA);
    const anon = await pwRequest.newContext({ baseURL });
    expect((await anon.post("/api/auth/reset-request", { data: { email: uniqueEmail("nobody") } })).status()).toBe(200);
    expect((await anon.post("/api/auth/reset-request", { data: { email } })).status()).toBe(200);
    const token = tokenFrom(lastEmailTo(email)!.text);
    expect((await anon.post("/api/auth/reset", { data: { token, password: "new-password-9" } })).status()).toBe(200);
    expect((await anon.post("/api/auth/reset", { data: { token, password: "other-password-9" } })).status()).toBe(400);
    expect((await deviceA.get("/api/auth/me")).status()).toBe(401); // old session ended
    const fresh = await pwRequest.newContext({ baseURL });
    expect((await fresh.post("/api/auth/login", { data: { email, password: "password123" } })).status()).toBe(401);
    expect((await fresh.post("/api/auth/login", { data: { email, password: "new-password-9" } })).status()).toBe(200);
  });

  test("sign out everywhere ends every session", async ({ baseURL }) => {
    const one = await pwRequest.newContext({ baseURL });
    const email = await signUpApi(one);
    const two = await pwRequest.newContext({ baseURL });
    await two.post("/api/auth/login", { data: { email, password: "password123" } });
    expect((await two.get("/api/auth/me")).status()).toBe(200);
    expect((await one.post("/api/auth/logout-all")).status()).toBe(204);
    expect((await two.get("/api/auth/me")).status()).toBe(401);
  });
});

test.describe("stripe webhooks", () => {
  const stripe = new Stripe("sk_test_dummy");
  const secret = "whsec_test_secret";
  const send = (api: Awaited<ReturnType<typeof pwRequest.newContext>>, event: object) => {
    const payload = JSON.stringify(event);
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
    return api.post("/api/webhooks/stripe", { data: payload, headers: { "stripe-signature": header, "content-type": "application/json" } });
  };
  const subscription = (userId: string, price: string, status = "active") => ({
    id: `sub_${userId.slice(0, 8)}`, object: "subscription", status, metadata: { userId },
    items: { data: [{ price: { id: price }, current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400 }] },
  });

  test("a paid credit pack adds 500 credits exactly once", async ({ baseURL }) => {
    const user = await pwRequest.newContext({ baseURL });
    await signUpApi(user);
    const me = await (await user.get("/api/auth/me")).json();
    const hook = await pwRequest.newContext({ baseURL });
    const session = { id: `cs_${me.id.slice(0, 8)}`, object: "checkout.session", mode: "payment", payment_status: "paid", metadata: { userId: me.id, kind: "credit_pack" } };
    await send(hook, { id: `evt_pack1_${me.id}`, object: "event", type: "checkout.session.completed", data: { object: session } });
    expect((await (await user.get("/api/auth/me")).json()).credits).toBe(900);
    await send(hook, { id: `evt_pack2_${me.id}`, object: "event", type: "checkout.session.completed", data: { object: session } });
    expect((await (await user.get("/api/auth/me")).json()).credits).toBe(900);
  });

  test("bad signatures are rejected", async ({ baseURL }) => {
    const anon = await pwRequest.newContext({ baseURL });
    const res = await anon.post("/api/webhooks/stripe", { data: "{}", headers: { "stripe-signature": "t=1,v1=bad" } });
    expect(res.status()).toBe(400);
  });

  test("subscription events set the plan, are idempotent, and credits are granted once", async ({ baseURL }) => {
    const user = await pwRequest.newContext({ baseURL });
    await signUpApi(user);
    const me = await (await user.get("/api/auth/me")).json();
    const hook = await pwRequest.newContext({ baseURL });

    const upd = { id: `evt_upd_${me.id}`, object: "event", type: "customer.subscription.updated", data: { object: subscription(me.id, "price_plus_monthly") } };
    const r1 = await send(hook, upd);
    expect(r1.status()).toBe(200);
    expect((await r1.json()).duplicate).toBe(false);
    const r2 = await send(hook, upd);
    expect((await r2.json()).duplicate).toBe(true);
    expect((await (await user.get("/api/auth/me")).json()).plan).toBe("plus");

    const invoice = (id: string) => ({ id, object: "event", type: "invoice.paid", data: { object: {
      id: `in_${me.id.slice(0, 8)}`, object: "invoice", customer_email: me.email,
      parent: { subscription_details: { subscription: subscription(me.id, "price_plus_monthly") } },
    } } });
    await send(hook, invoice(`evt_inv1_${me.id}`));
    expect((await (await user.get("/api/auth/me")).json()).credits).toBe(1400);
    // the same invoice delivered as a different event id must not double-credit
    await send(hook, invoice(`evt_inv2_${me.id}`));
    expect((await (await user.get("/api/auth/me")).json()).credits).toBe(1400);

    const del = { id: `evt_del_${me.id}`, object: "event", type: "customer.subscription.deleted", data: { object: subscription(me.id, "price_plus_monthly", "canceled") } };
    await send(hook, del);
    expect((await (await user.get("/api/auth/me")).json()).plan).toBe("free");
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

  test("free plan tops back up to 25 once a day", async ({ baseURL }) => {
    const user = await pwRequest.newContext({ baseURL });
    await signUpApi(user);
    for (let i = 0; i < 10; i++) await generateDeckApi(user, "", "Drain", 10); // 0 left
    expect((await (await user.get("/api/auth/me")).json()).credits).toBe(0);
    const cron = await pwRequest.newContext({ baseURL });
    const run = () => cron.get("/api/cron/daily", { headers: { authorization: "Bearer test-cron-secret" } });
    expect((await (await run()).json()).results.freeTopUps).toBeGreaterThanOrEqual(1);
    expect((await (await user.get("/api/auth/me")).json()).credits).toBe(25);
    await generateDeckApi(user, "", "Spend", 1); // 25 - 13 = 12
    await run(); // same day: no second top-up
    expect((await (await user.get("/api/auth/me")).json()).credits).toBe(12);
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
