# Architecture: a rebuild of Gamma's core features

Working codename in code: `deck` (the product name comes from replica-brand).

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Next.js 16 (App Router) + TypeScript + React 19 | one codebase for pages, route handlers and streaming AI responses |
| styling | Tailwind CSS 4, tokens from replica-design as CSS variables | themes are just a different set of variables on the deck root |
| database | Postgres (Neon or Supabase in prod); PGlite (embedded Postgres) in dev/tests | same SQL everywhere, tests run with no server |
| ORM | none — `postgres`-style tagged SQL through a tiny adapter | 11 tables, hand SQL is clearer than an ORM and works on both drivers |
| auth | own email + password sessions (scrypt, httpOnly cookie, sessions table); magic link via email as a should-have | no third-party dependency for the one thing every request touches |
| AI text | Claude API (official `@anthropic-ai/sdk`), streaming, JSON-shaped output | structured outline + cards; a deterministic offline generator when no key is set (dev/tests) |
| AI images | Unsplash API (user's own key, attribution kept) or none | official API; AI image model can be added behind the same interface |
| payments | Stripe Checkout + Billing portal + webhooks | subscriptions and credit packs without building billing |
| email | Resend | magic links, share invites |
| export | PPTX: `pptxgenjs` in the browser. PDF: print stylesheet (`/decks/:id/print`) | no server rendering farm needed at launch |
| jobs | Vercel Cron: daily trash purge + expired session cleanup | two jobs, no queue needed |
| hosting | Vercel | zero-config Next.js, preview deploys |

One database. No microservices.

## Schema

Tables: 11 (users, sessions, email_tokens, themes, decks, cards, generations,
credit_ledger, deck_views, subscriptions, stripe_events).
Access rules: **data-layer checks** — every query in `src/server/queries.ts`
takes the session user's id and filters on `user_id`; the only unauthenticated
reads are the public deck view by `slug` with `link_access = 'view'` and
`archived_at is null`.

See `replica/schema.sql` (also the first migration in `db/migrations/001_init.sql`).

Hard constraints in the database, not the UI:
- `cards (deck_id, position)` unique, deferrable — reorders rewrite positions in one transaction.
- `users.credits >= 0` — a generation that would overdraw fails at the database.
- `credit_ledger (reason, ref_id)` unique for Stripe grants — a webhook delivered twice cannot double-credit.
- `deck_views (deck_id, viewer_key)` unique — a viewer refreshing counts once.

## API

### F09 Sign up / log in
| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| POST /api/auth/signup | create user (+400 credits ledger row), start session | anyone | email, password, name | user | F09 |
| POST /api/auth/login | verify password, start session | anyone | email, password | user | F09 |
| POST /api/auth/logout | delete session | signed in | — | 204 | F09 |
| GET /api/auth/me | current user, plan, credits | signed in | — | user | all |

### F01/F02 Generate
| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| POST /api/generate/outline | stream an outline (titles + bullets) | signed in | prompt or pasted text, settings | NDJSON `{type:'card', title, bullets}` | F01, F02 |
| POST /api/generate/deck | charge credits, create deck, stream cards | signed in | outline, settings | NDJSON `{type:'deck'}` then `{type:'card'}`… `{type:'done'}` | F01, F02 |

### F03/F05/F10 Decks and cards
| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| GET /api/decks?view=all\|favorites\|trash | list my decks | owner | — | deck summaries | F10 |
| POST /api/decks | create blank deck | signed in | title? | deck | F03 |
| GET /api/decks/:id | deck + cards | owner | — | deck | F03 |
| PATCH /api/decks/:id | title, theme, favorite, archive/restore, link_access, dimensions | owner | partial deck | deck | F03 F05 F07 F10 |
| PUT /api/decks/:id/cards | autosave: replace card list in one transaction | owner | cards[] | ok + updated_at | F03 |
| POST /api/decks/:id/duplicate | copy deck + cards | owner | — | deck | F10 |
| DELETE /api/decks/:id | delete forever (only from trash) | owner | — | 204 | F10 |

### F04 AI edit
| POST /api/ai/edit | rewrite one card or the whole deck from an instruction; charges credits | owner | deckId, cardId?, instruction | new cards | F04 |

### F07 Share and public view, F08 export, analytics
| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| GET /p/:slug | public read-only deck page | anyone if link_access = view | — | page | F07 |
| POST /api/views | analytics beacon (upsert by viewer cookie) | anyone viewing a public deck | slug, cardsSeen, seconds | 204 | F07 |
| GET /api/decks/:id/analytics | views, unique viewers, avg time | owner | — | stats | S19 |
| GET /decks/:id/print | print-ready page for PDF | owner | — | page | F08 |
| (client) PPTX export | pptxgenjs in the browser | owner | deck | .pptx | F08 |

### F11 Billing
| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| POST /api/billing/checkout | Stripe Checkout session for a plan or credit pack | signed in | priceKey | url | F11 |
| POST /api/billing/portal | Stripe billing portal | signed in | — | url | F11 |
| POST /api/webhooks/stripe | subscription + payment events | Stripe (signed) | event | 200 | F11 |

### Images
| GET /api/images/search?q= | Unsplash search proxy (keeps the key server-side) | signed in | q | image list with attribution | F01 F03 |

Webhooks in: Stripe (`checkout.session.completed`, `customer.subscription.updated|deleted`, `invoice.paid`).
Webhooks out: none.
Jobs: `purge-trash` daily 03:17 UTC — delete decks archived > 30 days; `clean-sessions` daily 03:41 UTC — delete expired sessions and email tokens.

Only official public APIs with the owner's keys (Anthropic, Unsplash, Stripe,
Resend). Nothing from Gamma's private endpoints.

## The parts that bite

- **AI cost and abuse:** charge credits *before* streaming, inside the same transaction that creates the generation; refund on failure. Cap input length (20k chars) and cards (free 10, paid 30).
- **Streaming:** route handlers return a `ReadableStream` of NDJSON; the client must handle partial lines and an aborted stream (refund + mark failed).
- **Model output shape:** ask for strict JSON blocks and validate every card; drop invalid blocks rather than failing the whole deck.
- **Idempotency:** Stripe events stored in `stripe_events`; credit grants unique on `(reason, ref_id)`.
- **Races:** two tabs autosaving the same deck — last write wins, with `updated_at` returned so the client can warn. Reorder positions rewritten in one transaction (deferrable unique).
- **Rate limits:** per-user limit on `/api/generate/*` and `/api/ai/edit` (10/min) in memory for one instance, Upstash later; Anthropic 429s retried by the SDK.
- **File/size limits:** card content JSON capped at 64 KB per card, 200 cards per deck.
- **Multi-tenancy:** every query filters on `user_id`; public route only by slug + `link_access`.
- **Time zones:** only created/updated stamps; stored UTC, shown in the viewer's locale.
- **XSS:** card content is a block tree rendered by React, never raw HTML; inline marks limited to bold/italic/link with `https:` URLs only.
- **GDPR deletion:** deleting a user cascades to everything they own; analytics hold no PII.
- **Search / realtime / offline:** not in the first release.

## Build order

1. **Vertical slice** (F09 → F01 → F03 → F06): S01, S03, S04, S05, S08, S09, S10, S15. Tables users, sessions, decks, cards, generations, credit_ledger. Routes auth/*, generate/*, decks/*, PUT cards.
2. **Must-haves:** themes switch (S13), layouts (S12), insert menu (S11), thumbnail rail reorder, undo/redo, AI edit (S14, /api/ai/edit), share + public view (S16, S18, /p/:slug), PDF export (S17), Stripe plans (S23, billing/*, webhook).
3. **Should-haves:** paste-in modes, tone/audience/amount, image search, speaker notes, analytics (S19), PPTX export, trash/duplicate/favourite, templates (S20), custom themes (S21), magic link, Google sign-in, watermark on free.
4. **Fixes from replica-entrepreneur:** see `replica/opportunities.md` once written.
