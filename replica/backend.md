# Backend

Every service below is the owner's own account and key, through its official
public API. Nothing calls Gamma. Keys go in `.env.local` (see `.env.example`).
Claude never created accounts or typed keys.

## What is wired

| area | how | env | verified by |
| --- | --- | --- | --- |
| Database | Postgres. PGlite (embedded) when `DATABASE_URL` is empty; postgres.js otherwise. Migrations in `db/migrations`, run by `npm run db:migrate` and on first connect. Seed: `npm run db:seed` (demo@example.com / demo-password-1, invented content). | `DATABASE_URL` | all e2e tests run on a fresh in-memory DB |
| Access rules | Data-layer checks: every query filters on the session user's id (`src/server/queries.ts`). Public reads only by unguessable slug with `link_access = 'view'`. | — | `backend.spec.ts` › a second user gets 404 on every route of someone else's deck |
| Auth | Email + password (scrypt), httpOnly SameSite=Lax cookie, Secure in production, sessions table (token hashed). Email verification, magic link (creates the account on first use), password reset (ends every session), sign out everywhere, Google sign-in (OIDC code + PKCE), account deletion that cancels Stripe subscriptions and cascades every row. Email links are consumed by POST from a page, so link scanners cannot burn them. | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `backend.spec.ts` › email flows |
| AI | `@anthropic-ai/sdk` 1.8.0, `claude-opus-5-5`, streaming JSON Lines, effort `low` for outlines and `medium` for cards and edits, server-side refusal fallbacks (`fallbacks: "default"`), user text fenced as data. Invalid lines dropped. Offline drafting engine when no key. | `ANTHROPIC_API_KEY`, `AI_MODEL` | `backend.spec.ts` › claude engine, against `tests/mock-anthropic.mjs` (no live call was made) |
| Credits | Charged in the same transaction that records the generation (`credits >= 0` check makes overdraw impossible); refunded on failure; ledger table. | — | `backend.spec.ts` › credits |
| Photos | Unsplash search API with attribution shown on the card and download tracking, as Unsplash's API guidelines require. | `UNSPLASH_ACCESS_KEY` | manual; needs a key |
| Payments | Stripe Checkout (subscription), Customer Portal (change card, switch plan, cancel in one click), webhooks with signature check, event id stored, handlers in one transaction, credits granted once per invoice. Events: `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.paid`, `invoice.payment_failed` (emails the customer). | `STRIPE_*` | `backend.spec.ts` › stripe webhooks (signed test events, duplicates) |
| Email | Resend REST API from the owner's verified domain. Templates written fresh (`src/server/email.ts`). Dev without a key prints to the console; production refuses to pretend. | `RESEND_API_KEY`, `EMAIL_FROM` | `backend.spec.ts` via `EMAIL_OUTBOX` test hook |
| Jobs | Vercel Cron daily at 03:17 UTC: purge decks in trash > 30 days, expired sessions and tokens, old webhook ids. Each job isolated; failures logged and retried next day. | `CRON_SECRET` | `backend.spec.ts` › jobs |
| Rate limits | In-memory sliding window per user/IP: sign-up, login, magic link, reset, outline, deck, AI edit, photo search, views. One instance only; move to Upstash/Redis when scaling out. | `RATE_LIMIT_MULTIPLIER` (tests only) | `backend.spec.ts` › rate limits |

## Owner to-do (Claude does not do these)

1. **Stripe** (test mode): create products Plus and Pro with monthly and yearly prices, copy the four price ids into env, add a webhook endpoint `APP_URL/api/webhooks/stripe` with the five events above, copy its signing secret. Turn on the Customer Portal and allow cancellation and plan switching.
2. **Resend**: verify the sending domain (SPF, DKIM records), create an API key.
3. **Google**: create an OAuth client (Web), add redirect URI `APP_URL/api/auth/google/callback`. Scopes are `openid email profile` only, which are not sensitive, so no Google verification review is needed. Publish the consent screen before launch.
4. **Anthropic**: create an API key in the Console, set a monthly spend limit.
5. **Unsplash**: register an app, apply for production rate limits once live (demo apps get 50 requests an hour).
6. **Database**: create a Neon or Supabase Postgres, set `DATABASE_URL`, run `npm run db:migrate`, confirm daily backups / point-in-time restore are on in the host's dashboard.

## Security checklist

- [x] secrets only in env vars, `.env*` in `.gitignore` (`.env.example` kept), no server env read in client components
- [x] input validated on the server with zod on every route (`body()` helper), JSON body size capped
- [x] authorisation checked on every read and write, tested with a second user
- [x] rate limits on sign-up, login, magic link, reset, generation, AI edit, photo search
- [x] webhooks verify signatures (Stripe), cron requires a bearer secret
- [x] uploads: none accepted server-side; images are https links only; imported files are read in the browser, size-capped at 200 KB
- [x] no user data in URLs or logs (tokens only in emailed links; errors log types, not bodies)
- [x] dependencies audited: `npm audit --omit=dev` reports 0 (zod upgraded to 4.6.7; image-size overridden to 2.1.0)
- [x] cross-site writes blocked (Origin check + SameSite cookies)
- [x] card content is a typed block tree rendered by React; links limited to https
- [ ] privacy policy listing every processor: Anthropic, Stripe, Resend, Unsplash, Google (sign-in), the host and database. Written in replica-launch, needs the owner's legal review.
- [ ] Content-Security-Policy header (needs nonces for Next inline scripts; do before launch)
- [ ] distributed rate limiting when running more than one instance
