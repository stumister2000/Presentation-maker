# Landing page

Built at `/` (`src/app/page.tsx`), with `/privacy` and `/terms` drafts.
Signed-in visitors go straight to their decks. Angle: **no surprise walls**
(`replica/fixes.md`). Voice: plain, upfront, warm (`replica/brand.md`).
No testimonials, user counts, ratings or logos: there are none yet, and the
test `L-H1` fails if any appear.

1. **Hero.** "Presentations in a minute. The price before you start." Under it: describe, shape, get a deck; the cost first, never held behind a paywall. Button: *Start with 400 free credits*. Real screenshot of the editor (`public/product-editor.webp`).
2. **The problem.** "AI decks are fast. The surprises are not." Two points, paraphrased from the top hate themes: cut off halfway by credits; fixing text size and fonts afterwards and template sameness.
3. **How it works.** Say what you need → shape the outline → get your deck. Real screenshot of the outline step with the cost line visible.
4. **Features, fixes first.** The cost before you click · never locked out of your own work · text size for the whole deck · design notes it follows. Then the parity row: AI rewrite, themes, present mode, share links with analytics, PDF and PowerPoint.
5. **Pricing.** Free / Solo / Pro from `src/lib/plans.ts` (same source as Settings), plus the 500-credit pack.
6. **FAQ.** What is a credit · what happens when I run out · can I bring in slides from other presentation tools (honest: not yet; .txt / .md in, PPTX / PDF out) · will it work in PowerPoint · how do I cancel · who sees my decks.
7. **Final call to action.** "Your next deck, without the small print." Button: *Make my first deck*.

Checks: axe WCAG 2.1 AA clean on `/`, `/privacy`, `/terms` (tests `L-H1`, `L-H2`); token contrast 0 failures; no horizontal scroll at 390px.
