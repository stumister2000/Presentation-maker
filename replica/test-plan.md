# Test plan: presentation-maker clone

Build: c1fa4ea  Date: 2026-11-24  Env: local production build, fresh in-memory Postgres per run, offline AI engine (3200) and Claude engine against a mock Messages API (3201).

Run it: `npm run build && npm run e2e` (51 tests, about 1.5 minutes).
Every UI test fails on a console error, an uncaught page error or any 5xx response; screens get an axe WCAG 2.1 AA scan (`tests/e2e/fixtures.ts`).

| case | flow | type | steps | expected | auto | result |
| --- | --- | --- | --- | --- | --- | --- |
| F01-H1 | generate from prompt | happy | sign up → prompt → 5 cards → outline → pick theme → generate | 5 cards in editor, credits 400 → 375, axe clean on S05/S08/S10 | e2e | pass |
| F01-E1 | | edge: empty input | blank / spaces | Draft outline disabled | e2e | pass |
| F01-E2 | | edge: accents and emoji | "Café crème ☕ …" | title keeps every character | e2e | pass |
| F01-E3 | | edge: very long input | 2,500 chars | capped at 2,000, not rejected | e2e | pass |
| F01-E4 | | edge: outline edits | rename, remove, reorder | deck follows the edited outline | e2e | pass |
| F01-E5 | | edge: back mid-flow | outline → Back | prompt kept | e2e | pass |
| F01-E6 | | edge: double click submit | double click Generate | exactly one deck | e2e | pass |
| F01-E7 | | edge: refresh mid-flow | reload editor right after generation | every card there | e2e | pass |
| F01-N1 | | negative: out of credits | drain to 0, generate | upgrade dialog, link to plans, no error | e2e | pass |
| F01-N2 | | negative: credits never overdraw | API: generate with 18 credits left | 402, balance unchanged | e2e | pass |
| F01-N3 | | negative: rate limit | 7 decks in a minute | 7th gets 429 | e2e | pass |
| F01-N4 | | negative: AI service fails mid-stream | kill the AI mid-generation | partial deck kept, unused credits refunded | manual | not run (needs a real key) |
| F02-H1 | paste notes | happy | paste with ---, "Keep my words" | 3 cards, wording kept | e2e | pass |
| F02-E1 | | edge: long text | counter | shows length / 20,000 | e2e | pass |
| F03-H1 | edit a card | happy | edit heading with accents/emoji, reload | saved, survives reload, axe clean | e2e | pass |
| F03-E1 | | slash menu | Enter, "/", "bullet", type fast | list with both items, no lost keystrokes | e2e | pass (BUG-005 fixed) |
| F03-E2 | | undo / redo | delete card, Ctrl+Z, Ctrl+Shift+Z | restored, removed again | e2e | pass |
| F03-E3 | | reorder, duplicate, add, layout | card menus | persists after reload | e2e | pass |
| F03-E4 | | speaker notes | type notes, reload | saved | e2e | pass |
| F03-E5 | | keyboard only | focus heading, type, Escape | text saved | e2e | pass |
| F03-E6 | | offline | go offline, edit, back online | "Offline. Retrying…", then saved | e2e | pass |
| F03-E7 | | expired session | clear cookies, edit | "Signed out" + "Sign in again" link | e2e | pass (BUG-003 fixed) |
| F03-E8 | | two tabs | edit in both | later save wins, no crash | e2e | pass |
| F03-E9 | | second user's data | user B on user A's deck: GET, PATCH, PUT cards, duplicate, analytics, AI edit, DELETE | 404 every time, list empty | e2e | pass |
| F04-H1 | edit with AI | happy | "Make it shorter" | cards updated, 5 credits charged, axe clean | e2e | pass |
| F04-E1 | | Claude engine | edit one card via mock API | same ids, edited content | e2e | pass |
| F05-H1 | theme | happy | pick Ember, reload | still Ember, axe clean | e2e | pass |
| F06-H1 | present | happy + keyboard | arrows, Space, Home, End, N, Esc | counter right, notes panel, exits, axe clean | e2e | pass (BUG-002 fixed) |
| F07-H1 | share | happy | link on, guest opens, presents | guest sees cards + badge, analytics shows 1 viewer, axe clean | e2e | pass |
| F07-N1 | | permission denied | link off, guest opens | "not available" page | e2e | pass |
| F07-N2 | | private by slug | never shared | "not available" | e2e | pass |
| F08-H1 | export | PPTX | Export → PowerPoint | .pptx zip > 10 KB | e2e | pass |
| F08-H2 | | PDF | print view | one page per card | e2e | pass |
| F08-M1 | | PDF fidelity | open the PDF from Chrome's print dialog | layouts, fonts, artwork look right | manual | checklist below |
| F09-H1 | sign up | happy | form | create screen with welcome note, axe clean | e2e | pass |
| F09-N1 | | wrong password, duplicate email, bad email | | clear messages | e2e | pass |
| F09-E1 | | expired session on a protected page | open deck signed out | login, then back to the deck | e2e | pass |
| F09-E2 | | forgot password | request | same answer for any address | e2e | pass |
| F09-E3 | | verify email, magic link, reset, sign out everywhere | API | each link works once; reset ends other sessions | e2e | pass |
| F09-M1 | | Google sign-in with a real Google account | | lands on dashboard | manual | needs owner's OAuth client |
| F09-M2 | | real emails arrive and links work | | inbox, not spam | manual | needs Resend + domain |
| F10-H1 | organise | rename, favourite, duplicate, search, trash, restore, delete forever | | each works, axe clean | e2e | pass |
| F11-H1 | plans | settings | | 3 plans, current marked, axe clean | e2e | pass |
| F11-E1 | | webhooks | signed events, duplicate delivery, same invoice twice | plan set once, credits once | e2e | pass |
| F11-N1 | | bad webhook signature | | 400 | e2e | pass |
| F11-M1 | | Stripe Checkout end to end with 4242 4242 4242 4242 | | plan Plus, +1,000 credits | manual | needs Stripe test keys |
| F11-M2 | | card declined 4000 0000 0000 0002 | | Stripe shows the error, plan unchanged | manual | needs Stripe test keys |
| F11-M3 | | cancel from the portal | | plan back to Free at period end | manual | needs Stripe test keys |
| F12-H1 | templates | use a template | | 10 cards, no credits spent, axe clean | e2e | pass |
| M-H1 | mobile (Pixel 7) | create, present, dashboard menu | | no sideways scroll, axe clean | e2e | pass (BUG-004 fixed) |
| J-H1 | jobs | daily cron | | needs the secret | e2e | pass |

Not applicable: time zones / daylight saving (only created/updated stamps, shown in the viewer's locale).

## Manual checklist for the owner

Needs your keys, so not run here. Tick each and report back anything odd:

- [ ] F01-N4: with `ANTHROPIC_API_KEY` set, generate a 10-card deck; then stop the network mid-way. Expect the cards made so far and a refund note.
- [ ] Generate 3 real decks with the Claude engine (pitch, lesson, report) and check tone, language (try Spanish) and that no statistics are invented.
- [ ] F08-M1: open a PDF export and a PPTX export in PowerPoint / Keynote / Google Slides.
- [ ] F09-M1: Google sign-in with a fresh Google account and with an account whose email already exists here.
- [ ] F09-M2: sign-up email, magic link and reset email arrive in Gmail and Outlook inboxes.
- [ ] F11-M1/M2/M3: Stripe test mode with the cards above; `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
- [ ] Photos: with `UNSPLASH_ACCESS_KEY`, pick "Photos" on the outline step; credits appear on the photos.
- [ ] Screen reader pass (VoiceOver or NVDA) over create → editor → present.
