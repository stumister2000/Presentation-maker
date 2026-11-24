import "server-only";
import { q, tx, type Q } from "./db";
import { HttpError, randomToken } from "./auth";
import { sanitizeCard, type Card } from "@/lib/blocks";
import { DEFAULT_THEME, getTheme } from "@/lib/themes";

// Data layer. Every function that touches user-owned rows takes userId and
// filters on it. That is the access rule (see replica/architecture.md).

export const SIGNUP_CREDITS = 400;
export const PLAN_LIMITS = {
  free: { maxCards: 10, watermark: true, monthlyCredits: 0 },
  plus: { maxCards: 20, watermark: false, monthlyCredits: 1000 },
  pro: { maxCards: 40, watermark: false, monthlyCredits: 4000 },
} as const;
export type Plan = keyof typeof PLAN_LIMITS;

export type DeckFormat = "presentation" | "document" | "webpage" | "social";
export type LinkAccess = "none" | "view";

export interface DeckSummary {
  id: string;
  title: string;
  slug: string;
  themeId: string;
  textScale: string;
  format: DeckFormat;
  isFavorite: boolean;
  archivedAt: string | null;
  updatedAt: string;
  cardCount: number;
  firstCard: Card | null;
}
export interface Deck extends Omit<DeckSummary, "cardCount" | "firstCard"> {
  dimensions: string;
  textScale: string;
  linkAccess: LinkAccess;
  createdAt: string;
  cards: Card[];
}

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));

function cardFromRow(r: Record<string, unknown>): Card {
  return sanitizeCard({
    id: r.id,
    layout: r.layout,
    imageUrl: r.image_url,
    imageAlt: r.image_alt,
    imageCredit: r.image_credit ?? "",
    content: typeof r.content === "string" ? JSON.parse(r.content) : r.content,
    notes: r.notes,
  })!;
}

/* ---------- users ---------- */

export async function createUser(email: string, name: string, passwordHash: string) {
  return tx(async (t) => {
    const existing = await t`select id from users where lower(email) = lower(${email})`;
    if (existing.length) throw new HttpError(409, "An account with that email already exists.", "email_taken");
    const [u] = await t<{ id: string }>`
      insert into users (email, name, password_hash, credits) values (${email}, ${name}, ${passwordHash}, ${SIGNUP_CREDITS}) returning id`;
    await t`insert into credit_ledger (user_id, delta, reason) values (${u.id}, ${SIGNUP_CREDITS}, 'signup')`;
    return u.id;
  });
}

export async function findUserByEmail(email: string) {
  const rows = await q<{ id: string; password_hash: string | null }>`select id, password_hash from users where lower(email) = lower(${email})`;
  return rows[0] ?? null;
}

export async function getUser(userId: string) {
  const rows = await q<{ id: string; email: string; name: string; plan: Plan; credits: number; stripe_customer_id: string | null }>`
    select id, email, name, plan, credits, stripe_customer_id from users where id = ${userId}`;
  return rows[0] ?? null;
}

export async function updateUserName(userId: string, name: string) {
  await q`update users set name = ${name}, updated_at = now() where id = ${userId}`;
}

export async function deleteUser(userId: string) {
  await q`delete from users where id = ${userId}`;
}

/* ---------- credits ---------- */

/** Take credits or throw 402. Runs inside the caller's transaction when given one. */
export async function spendCredits(userId: string, amount: number, reason: "generation" | "ai_edit", refId: string | null, t: Q = q) {
  if (amount <= 0) return;
  const rows = await t<{ credits: number }>`
    update users set credits = credits - ${amount}, updated_at = now()
    where id = ${userId} and credits >= ${amount} returning credits`;
  if (!rows.length) throw new HttpError(402, "You are out of AI credits.", "out_of_credits");
  await t`insert into credit_ledger (user_id, delta, reason, ref_id) values (${userId}, ${-amount}, ${reason}, ${refId})`;
}

export async function refundCredits(userId: string, amount: number, refId: string) {
  if (amount <= 0) return;
  await tx(async (t) => {
    await t`update users set credits = credits + ${amount} where id = ${userId}`;
    await t`insert into credit_ledger (user_id, delta, reason, ref_id) values (${userId}, ${amount}, 'refund', ${refId})`;
  });
}

/* ---------- decks ---------- */

export async function listDecks(userId: string, view: "all" | "favorites" | "trash" | "templates" = "all"): Promise<DeckSummary[]> {
  const rows = await q`
    select d.id, d.title, d.slug, d.theme_id, d.text_scale, d.format, d.is_favorite, d.archived_at, d.updated_at,
      (select count(*)::int from cards c where c.deck_id = d.id) as card_count,
      (select row_to_json(c) from cards c where c.deck_id = d.id order by c.position limit 1) as first_card
    from decks d
    where d.user_id = ${userId}
      and (case ${view}::text
        when 'trash' then d.archived_at is not null
        when 'favorites' then d.archived_at is null and d.is_favorite
        else d.archived_at is null end)
    order by d.updated_at desc
    limit 200`;
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    themeId: r.theme_id as string,
    textScale: (r.text_scale as string) ?? "m",
    format: r.format as DeckFormat,
    isFavorite: r.is_favorite as boolean,
    archivedAt: r.archived_at ? iso(r.archived_at) : null,
    updatedAt: iso(r.updated_at),
    cardCount: r.card_count as number,
    firstCard: r.first_card ? cardFromRow(typeof r.first_card === "string" ? JSON.parse(r.first_card) : (r.first_card as Record<string, unknown>)) : null,
  }));
}

function deckFromRow(r: Record<string, unknown>, cards: Card[]): Deck {
  return {
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    themeId: r.theme_id as string,
    format: r.format as DeckFormat,
    dimensions: r.dimensions as string,
    textScale: (r.text_scale as string) ?? "m",
    linkAccess: r.link_access as LinkAccess,
    isFavorite: r.is_favorite as boolean,
    archivedAt: r.archived_at ? iso(r.archived_at) : null,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    cards,
  };
}

async function loadCards(deckId: string, t: Q = q): Promise<Card[]> {
  const rows = await t`select * from cards where deck_id = ${deckId} order by position`;
  return rows.map(cardFromRow);
}

export async function getDeck(userId: string, deckId: string): Promise<Deck> {
  if (!/^[0-9a-f-]{36}$/i.test(deckId)) throw new HttpError(404, "Not found.");
  const rows = await q`select * from decks where id = ${deckId} and user_id = ${userId}`;
  if (!rows.length) throw new HttpError(404, "Not found.");
  return deckFromRow(rows[0], await loadCards(deckId));
}

/** Public read: only by slug, only when shared, never from the trash. */
export async function getPublicDeck(slug: string): Promise<(Deck & { ownerPlan: Plan }) | null> {
  const rows = await q`
    select d.*, u.plan as owner_plan from decks d join users u on u.id = d.user_id
    where d.slug = ${slug} and d.link_access = 'view' and d.archived_at is null`;
  if (!rows.length) return null;
  return { ...deckFromRow(rows[0], await loadCards(rows[0].id as string)), ownerPlan: rows[0].owner_plan as Plan };
}

async function insertCards(t: Q, deckId: string, cards: Card[]) {
  let i = 0;
  for (const c of cards) {
    await t`insert into cards (deck_id, position, layout, image_url, image_alt, image_credit, content, notes)
      values (${deckId}, ${i++}, ${c.layout}, ${c.imageUrl}, ${c.imageAlt}, ${c.imageCredit}, ${c.content}, ${c.notes})`;
  }
}

export async function createDeck(
  userId: string,
  input: { title: string; themeId?: string; format?: DeckFormat; dimensions?: string; cards: Card[] },
  t?: Q,
): Promise<string> {
  const run = async (tq: Q) => {
    const [d] = await tq<{ id: string }>`
      insert into decks (user_id, title, slug, theme_id, format, dimensions)
      values (${userId}, ${input.title.slice(0, 200) || "Untitled"}, ${randomToken(9)}, ${getTheme(input.themeId ?? DEFAULT_THEME).key},
              ${input.format ?? "presentation"}, ${input.dimensions ?? "fluid"})
      returning id`;
    await insertCards(tq, d.id, input.cards);
    return d.id;
  };
  return t ? run(t) : tx(run);
}

export async function appendCard(userId: string, deckId: string, card: Card) {
  await tx(async (t) => {
    const own = await t`select id from decks where id = ${deckId} and user_id = ${userId}`;
    if (!own.length) throw new HttpError(404, "Not found.");
    const [{ n }] = await t<{ n: number }>`select count(*)::int as n from cards where deck_id = ${deckId}`;
    await t`insert into cards (deck_id, position, layout, image_url, image_alt, image_credit, content, notes)
      values (${deckId}, ${n}, ${card.layout}, ${card.imageUrl}, ${card.imageAlt}, ${card.imageCredit}, ${card.content}, ${card.notes})`;
  });
}

export interface DeckPatch {
  title?: string;
  themeId?: string;
  isFavorite?: boolean;
  archived?: boolean;
  linkAccess?: LinkAccess;
  dimensions?: string;
  textScale?: string;
}

export async function updateDeck(userId: string, deckId: string, p: DeckPatch): Promise<void> {
  const rows = await q`
    update decks set
      title = coalesce(${p.title?.slice(0, 200) ?? null}, title),
      theme_id = coalesce(${p.themeId ? getTheme(p.themeId).key : null}, theme_id),
      is_favorite = coalesce(${p.isFavorite ?? null}::boolean, is_favorite),
      link_access = coalesce(${p.linkAccess ?? null}, link_access),
      dimensions = coalesce(${p.dimensions ?? null}, dimensions),
      text_scale = coalesce(${p.textScale ?? null}, text_scale),
      archived_at = case when ${p.archived ?? null}::boolean is null then archived_at
                         when ${p.archived ?? null}::boolean then now() else null end,
      updated_at = now()
    where id = ${deckId} and user_id = ${userId}
    returning id`;
  if (!rows.length) throw new HttpError(404, "Not found.");
}

/** Autosave: replace the card list in one transaction. */
export async function saveCards(userId: string, deckId: string, cards: Card[]): Promise<string> {
  if (cards.length > 200) throw new HttpError(413, "A deck can hold up to 200 cards.");
  return tx(async (t) => {
    const rows = await t`update decks set updated_at = now() where id = ${deckId} and user_id = ${userId} returning updated_at`;
    if (!rows.length) throw new HttpError(404, "Not found.");
    await t`delete from cards where deck_id = ${deckId}`;
    await insertCards(t, deckId, cards);
    return iso(rows[0].updated_at);
  });
}

export async function duplicateDeck(userId: string, deckId: string): Promise<string> {
  const d = await getDeck(userId, deckId);
  const id = await createDeck(userId, {
    title: `${d.title} (copy)`.slice(0, 200),
    themeId: d.themeId,
    format: d.format,
    dimensions: d.dimensions,
    cards: d.cards.map((c) => ({ ...c, id: crypto.randomUUID() })),
  });
  if (d.textScale !== "m") await updateDeck(userId, id, { textScale: d.textScale });
  return id;
}

export async function deleteDeckForever(userId: string, deckId: string) {
  const rows = await q`delete from decks where id = ${deckId} and user_id = ${userId} and archived_at is not null returning id`;
  if (!rows.length) throw new HttpError(409, "Move the deck to the trash before deleting it.");
}

/* ---------- generations ---------- */

export async function createGeneration(
  userId: string,
  g: { source: "prompt" | "paste" | "import" | "ai_edit"; inputText: string; settings: object; credits: number; deckId?: string | null },
): Promise<string> {
  return tx(async (t) => {
    const [row] = await t<{ id: string }>`
      insert into generations (user_id, deck_id, source, input_text, settings, status, credits_used)
      values (${userId}, ${g.deckId ?? null}, ${g.source}, ${g.inputText.slice(0, 20000)}, ${g.settings}, 'generating', ${g.credits})
      returning id`;
    await spendCredits(userId, g.credits, g.source === "ai_edit" ? "ai_edit" : "generation", row.id, t);
    return row.id;
  });
}

export async function finishGeneration(id: string, status: "completed" | "failed", patch: { deckId?: string; outline?: unknown; error?: string } = {}) {
  await q`update generations set status = ${status}, deck_id = coalesce(${patch.deckId ?? null}::uuid, deck_id),
    outline = coalesce(${patch.outline ?? null}::jsonb, outline), error = ${patch.error ?? null}, updated_at = now() where id = ${id}`;
}

/* ---------- analytics ---------- */

export async function recordView(slug: string, viewerKey: string, cardsSeen: number, seconds: number) {
  const deck = await q<{ id: string }>`select id from decks where slug = ${slug} and link_access = 'view' and archived_at is null`;
  if (!deck.length) return;
  await q`
    insert into deck_views (deck_id, viewer_key, cards_seen, seconds)
    values (${deck[0].id}, ${viewerKey}, ${Math.min(cardsSeen, 500)}, ${Math.min(seconds, 21600)})
    on conflict (deck_id, viewer_key) do update set
      cards_seen = greatest(deck_views.cards_seen, excluded.cards_seen),
      seconds = greatest(deck_views.seconds, excluded.seconds),
      updated_at = now()`;
}

export async function getAnalytics(userId: string, deckId: string) {
  await getDeck(userId, deckId); // ownership check
  const [s] = await q<{ viewers: number; avg_seconds: number; avg_cards: number; last_view: unknown }>`
    select count(*)::int as viewers, coalesce(avg(seconds), 0)::int as avg_seconds,
      coalesce(avg(cards_seen), 0)::float as avg_cards, max(updated_at) as last_view
    from deck_views where deck_id = ${deckId}`;
  const daily = await q<{ day: string; n: number }>`
    select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day, count(*)::int as n
    from deck_views where deck_id = ${deckId} and created_at > now() - interval '14 days'
    group by 1 order by 1`;
  return { viewers: s.viewers, avgSeconds: s.avg_seconds, avgCards: Math.round(s.avg_cards * 10) / 10, lastView: s.last_view ? iso(s.last_view) : null, daily };
}
