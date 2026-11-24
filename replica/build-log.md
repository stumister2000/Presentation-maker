# Build log

All code is written from scratch for this project, based on the recon map. No
markup, styles, scripts, images or copy from the original were used. Screenshots
of the clone are in `replica/clone-screens/` (desktop 1440×900 and `-mobile` 390×844).

The data layer is real, not a fake: embedded Postgres (PGlite) in dev and tests,
and the same SQL on hosted Postgres in production. Generation runs on an
offline drafting engine behind the `DeckEngine` interface until the backend
stage adds the Claude engine.

| ID | date | status | missing | harder than expected |
| --- | --- | --- | --- | --- |
| S01 Sign up / log in | 2026-11-24 | done | Google sign-in, magic link (backend) | — |
| S02 Onboarding | 2026-11-24 | partial | no role questions; new users land on S05 with a welcome note | — |
| S03 Dashboard | 2026-11-24 | done | folders; grid only (no list view) | live previews: one `ScaledCard` renders the first card at 960px and scales it |
| S04 Create picker | 2026-11-24 | done | — | — |
| S05 Generate prompt | 2026-11-24 | done | webpage/social formats | — |
| S06 Paste in text | 2026-11-24 | done | — | — |
| S07 Import | 2026-11-24 | partial | .pptx/.docx/.pdf/URL import (only .txt/.md) | — |
| S08 Outline editor | 2026-11-24 | done | drag-to-reorder (uses up/down buttons) | streaming into an editable list |
| S09 Generating | 2026-11-24 | done | — | refunds on mid-stream failure |
| S10 Editor | 2026-11-24 | done | multi-select, copy/paste of cards, comments | **bigger than it looked.** Inline editing that shows formatted text at rest and raw marks while typing needed a view/edit swap; React reused the DOM node and duplicated text until the two states got separate keys. |
| S11 Insert / slash menu | 2026-11-24 | done | tables, charts, embeds, diagram layouts | — |
| S12 Card layout | 2026-11-24 | done | per-card background colour, card width | — |
| S13 Theme panel | 2026-11-24 | done | custom themes (S21) | — |
| S14 AI edit panel | 2026-11-24 | partial | real model (backend stage) | — |
| S15 Present mode | 2026-11-24 | done | separate presenter window | fitting tall fluid cards: `ScaledCard` now measures content height |
| S16 Share | 2026-11-24 | partial | invite by email, comment/edit access, password | — |
| S17 Export | 2026-11-24 | done | PNG export, Google Slides | PPTX layout mapping from fluid cards is approximate |
| S18 Public view | 2026-11-24 | done | — | — |
| S19 Analytics | 2026-11-24 | done | per-card breakdown | — |
| S20 Templates | 2026-11-24 | done | more templates, categories | — |
| S21 Themes gallery / editor | — | not started | custom theme editor | — |
| S22 Settings | 2026-11-24 | done | — | — |
| S23 Upgrade / credits modal | 2026-11-24 | partial | Stripe checkout is stubbed until backend | — |
| S24 Trash | 2026-11-24 | done | 30-day purge job (backend) | — |

Mobile: block handles (+ / ⋯) are hidden under 640px so cards use the full
width. On phones, block-level move and delete go through the card ⋯ menu
or Backspace on an empty block.

Click-through: every screen above at 1440px and 390px, no console errors.
