# Deploy checklist: Fairdeck

Date: 2026-11-24  Commit: the deploy-stage commit on `claude/gamma-replica-skill-clone-w1kntd` (preflight run on top of 983979f)  **Go from user: not yet**

Nothing is live. Going live needs your accounts (host, database, Stripe,
Resend, Google, Anthropic, a domain) and your go. Every step that needs a
login, a card or a live key is yours; the exact values are below.

## Preflight (all must pass)

- [x] e2e suite green: **59 passed / 59** (`npm run build && npm run e2e`), plus 6/6 unit tests (`npm test`)
- [x] no open S1 or S2 bugs (`replica/bugs.md`: 8 found, 8 fixed)
- [x] parity: all must-haves done (**28/28**), feature score **85.3**
- [x] rebrand sweep clean (`python3 replica/tools/sweep.py . --config replica/brand.json` → exit 0)
- [x] store listing passes (`python3 replica/tools/listing.py replica/launch/listing.json` → 0 errors, 0 warnings). Web only for now; no store build yet.
- [x] production build passes (`npm run build`), `tsc --noEmit` clean
- [x] design tokens: 32 contrast pairs, 0 AA failures
- [x] `npm audit --omit=dev`: 0 vulnerabilities
- [x] privacy policy and terms pages at `/privacy` and `/terms`, every processor listed (Anthropic, Stripe, Resend, Unsplash, Google, host, database). **Drafts: need your company details and a lawyer's read.**
- [x] no cookie banner needed: only strictly necessary cookies (session; Google sign-in state for 10 minutes). Shared-deck analytics are cookieless.
- [x] account deletion works (test `account deletion` in `backend.spec.ts`: user, decks and public links gone; Stripe subscriptions cancelled first)
- [x] favicon (`/icon.svg`), titles ("… · Fairdeck"), OG image (`/opengraph-image`, 1200×630), email templates (`APP_NAME`) are Fairdeck's. App icon: not needed until a mobile build; the logo brief is in `replica/brand.md`.

Not blocking, but before real traffic:
- [ ] trademark / domain / handle checks in `replica/brand.md` (all "to run"), and a lawyer's search
- [ ] manual checks with real keys in `replica/test-plan.md` (Claude output quality, Stripe checkout and declined card, real emails, Google sign-in)
- [ ] Content-Security-Policy header (see `replica/backend.md`)

## Production

Recommended: **Vercel** (app) + **Neon** (Postgres) + Stripe + Resend.

1. **Database.** Create a *new* Neon project for production (not the one you test with). Enable point-in-time restore (on by default on paid plans; check). Copy the pooled connection string.
2. **Host.** Import `stumister2000/Presentation-maker` into Vercel. Production branch: `main` (merge this branch first). Pull requests get preview URLs automatically.
   - Build command: leave default; `package.json` has `vercel-build` = `npm run db:migrate && next build`, so **migrations run in the deploy**, once, before the new build goes live.
   - Use a separate Neon branch/database for Preview deployments so previews never migrate production.
3. **Env vars** (Vercel → Settings → Environment Variables, Production). Names match `.env.example`:

   | name | value |
   | --- | --- |
   | `APP_URL` | `https://fairdeck.<your-tld>` (your canonical host) |
   | `DATABASE_URL` | Neon production connection string |
   | `ANTHROPIC_API_KEY` | from console.anthropic.com; set a monthly spend limit there |
   | `UNSPLASH_ACCESS_KEY` | your Unsplash app's access key; apply for production limits |
   | `RESEND_API_KEY`, `EMAIL_FROM` | `EMAIL_FROM="Fairdeck <hello@<your-domain>>"` |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | your Google OAuth client |
   | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | **live** mode values |
   | `STRIPE_PRICE_PLUS_MONTHLY`, `…_PLUS_YEARLY`, `…_PRO_MONTHLY`, `…_PRO_YEARLY`, `STRIPE_PRICE_CREDITS_500` | live price ids (table in `replica/launch/pricing.md`) |
   | `CRON_SECRET` | a long random string (`openssl rand -hex 32`) |

   Never set `EMAIL_OUTBOX`, `RATE_LIMIT_MULTIPLIER`, `AUTO_MIGRATE` or `ANTHROPIC_BASE_URL` in production; they are test hooks.
4. **Stripe live.** Switch to live mode, recreate the five prices, add webhook endpoint `https://<host>/api/webhooks/stripe` with events `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`; copy its signing secret. Turn on the Customer Portal (cancel at period end, switch plans, update card) and the upcoming-renewal email. **Make one real purchase and refund it.**
5. **Google OAuth.** Add `https://<host>` to authorised JavaScript origins and `https://<host>/api/auth/google/callback` to redirect URIs. Scopes are `openid email profile` only, which are not sensitive: publish the consent screen, no verification review needed.
6. **Email.** In Resend, add and verify `<your-domain>`; add the records below.
7. **Cron.** `vercel.json` already schedules `/api/cron/daily` at 03:17 UTC; Vercel sends `Authorization: Bearer $CRON_SECRET`.

## Domain

Buy `fairdeck.<tld>` (after the name checks) at any registrar, add it in
Vercel → Domains, then set:

| record | name | value |
| --- | --- | --- |
| A | `@` | the apex IP Vercel shows in the domain settings |
| CNAME | `www` | `cname.vercel-dns.com` |
| TXT | as Vercel asks | Vercel's verification value, if shown |
| TXT (SPF) | as Resend shows (often `send`) | the SPF value Resend shows |
| TXT or CNAME (DKIM) | as Resend shows (e.g. `resend._domainkey`) | the DKIM value Resend shows |
| TXT (DMARC) | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@<your-domain>` → after 2–4 weeks of clean reports, `p=quarantine` |

- Canonical host: **apex** (`fairdeck.<tld>`); set `www` to redirect to it in Vercel.
- HTTPS: automatic on Vercel; open both hosts and check the padlock.

## Watch

- [ ] Error tracking: add Sentry (or Vercel's) with PII scrubbing; alert on 5xx and on failed generations.
- [ ] Uptime: check `https://<host>/` and `https://<host>/login` every minute (Better Stack, UptimeRobot or similar), alert to your phone.
- [ ] Analytics: a cookieless one (Plausible or Vercel Web Analytics) to keep the no-banner setup; add it to `/privacy`.
- [ ] Core flow on the live site, desktop and phone: sign up → generate a 5-card deck → edit → present → share link in a private window → export PPTX → upgrade with a real card → refund → cancel in the portal → delete the test account.

### First week

- AI cost per credit against the estimate in `pricing.md` (Anthropic console usage vs credits charged).
- Daily free top-up spend (`credit_ledger` rows with `ref_id like 'daily-%'`).
- Generation failures and refunds (`generations.status = 'failed'`).
- Emails landing in spam (send yourself sign-up, magic link and reset to Gmail and Outlook).
- Webhook deliveries in the Stripe dashboard: all 2xx.

## Mobile

No mobile app in this build. The store listing is ready in
`replica/launch/listing.json` for a later wrapper (Expo or a PWA shell).

Live URL: **none yet**. Waiting for your go and the account steps above.
