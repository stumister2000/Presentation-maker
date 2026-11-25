# Fairdeck

Describe a talk, shape the outline, get a designed, editable deck.
Next.js 16, Postgres, Claude. No sign-in, no credits, no plans: it opens
straight to your decks and runs as a single local user.

## Run it

```bash
npm install
cp .env.example .env.local   # all keys optional for local use
npm run dev                  # http://localhost:3000
```

Open http://localhost:3000. There is nothing to sign up for.

With no `DATABASE_URL`, an embedded Postgres (PGlite) lives in `.data/`.
With no `ANTHROPIC_API_KEY`, an offline drafting engine writes the decks;
add a key to `.env.local` for real AI writing.
`npm run db:seed` adds two example decks (stop the dev server first).

## Test it

```bash
npm test                       # unit
npm run build && npm run e2e   # 40 Playwright tests: every flow, mobile, axe accessibility
```

## Where things are

| path | what |
| --- | --- |
| `src/app` | pages and API routes |
| `src/server` | data layer (`queries.ts`), the local user, AI engines |
| `src/components` | UI primitives, card renderer, editor, present mode |
| `db/migrations` | SQL migrations (`npm run db:migrate`) |
| `tests` | unit, e2e, and a mock of the Claude Messages API |
| `replica/` | how this was planned and checked: recon, architecture, design tokens, test plan, bugs, parity, user research, brand, launch and deploy docs |

Note: the planning docs in `replica/` were written when the app had accounts,
credits and paid plans. Those were removed afterwards; anyone who can reach
the app can use it, so only run it somewhere private.
