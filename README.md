# Fairdeck

Describe a talk, shape the outline, get a designed, editable deck: and see
the price before you start. Next.js 16, Postgres, Claude.

## Run it

```bash
npm install
cp .env.example .env.local   # all keys optional for local use
npm run dev                  # http://localhost:3000
```

With no `DATABASE_URL`, an embedded Postgres (PGlite) lives in `.data/`.
With no `ANTHROPIC_API_KEY`, an offline drafting engine writes the decks.
`npm run db:seed` adds demo@example.com / demo-password-1 (stop the dev server first).

## Test it

```bash
npm test                       # unit
npm run build && npm run e2e   # 59 Playwright tests: API, every flow, mobile, axe accessibility
```

## Where things are

| path | what |
| --- | --- |
| `src/app` | pages and API routes |
| `src/server` | data layer (`queries.ts`), auth, AI engines, billing, email |
| `src/components` | UI primitives, card renderer, editor, present mode |
| `db/migrations` | SQL migrations (`npm run db:migrate`) |
| `tests` | unit, e2e, and a mock of the Claude Messages API |
| `replica/` | how this was planned and checked: recon, architecture, design tokens, test plan, bugs, parity, user research, brand, launch and deploy docs |

Deploying: `replica/deploy.md`.
