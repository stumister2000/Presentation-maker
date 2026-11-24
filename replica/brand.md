# Brand: Fairdeck

Angle (from `replica/fixes.md`): **no surprise walls**: the cost shown before
you start, and your work never held back.

## Name

### 20 candidates

| style | candidates |
| --- | --- |
| descriptive | Fairdeck, Plainslide, Outline Studio, Deckwright |
| compound | Cardloom, Keepdeck, Openleaf, Slatewise, Pitchyard |
| invented | Prosa, Talora, Brevio, Velmo |
| metaphor | Lantern, Trellis, Keel, Ledger |
| verb | Unfold, Lay Out, Show |

Cut on the filters: anything near the original in sound, look or meaning
(Greek letters: Delta, Sigma, Beta, Lambda were never considered), anything
near other tools in the category (Pitch, Tome, Prezi, Canva, Slidebean,
Decktopus, Beautiful, Brightdeck, ClearSlide; "Plainslide" is too close to
ClearSlide, "Pitchyard" to Pitch), generic words that cannot be owned
(Lantern, Trellis, Keel, Ledger, Unfold, Show), and hard-to-spell inventions.

### Shortlist of 5

| name | why it fits | risk |
| --- | --- | --- |
| **Fairdeck** (recommended) | says the angle in one word: fair price, fair deal, your deck | "fair" is common in marks; check classes 9 and 42 |
| Keepdeck | "your work is yours to keep" | sounds like an archiving tool |
| Cardloom | cards woven into a deck, matches the card editor | less about the angle |
| Openleaf | open, light, a page you can turn | "leaf" marks are crowded |
| Deckwright | a maker of decks, craftsmanship | longer, two syllables of "wr" confusion when heard |

### Screening checks

None of these could be run from the session that wrote this file (no network
access to the registries). Every row is **to run**. These are screening
checks, not legal clearance: before spending money on the name, have a
trademark lawyer run a proper search.

| check | where | Fairdeck | Keepdeck | Cardloom | Openleaf | Deckwright |
| --- | --- | --- | --- | --- | --- | --- |
| US trademark (classes 9, 42) | tmsearch.uspto.gov | to run | to run | to run | to run | to run |
| EU trademark | euipo.europa.eu eSearch / TMview | to run | to run | to run | to run | to run |
| Canada | ised-isde.canada.ca | to run | to run | to run | to run | to run |
| Global | WIPO Global Brand Database | to run | to run | to run | to run | to run |
| Domain (.com, .app, .io) | `whois fairdeck.com` or a registrar | to run | to run | to run | to run | to run |
| App Store and Google Play | search the exact name | to run | to run | to run | to run | to run |
| Handles | X, Instagram, TikTok, GitHub | to run | to run | to run | to run | to run |
| The web | "name + presentation" | to run | to run | to run | to run | to run |

If Fairdeck fails a check, Keepdeck is the fallback: change `APP_NAME` in
`src/lib/brand.ts` and `name` in `replica/brand.json`, then rerun the sweep.

## Palette

Primary moves from the placeholder indigo (too close to the original's
purple family) to a deep teal, a different hue family. Roles unchanged;
values in `replica/design/tokens.json`, generated into `src/styles/tokens.css`
with `npm run tokens`.

| role | value | on white |
| --- | --- | --- |
| accent | `#0b6e64` | 6.2:1 |
| accent-hover | `#085a52` | — |
| accent-soft | `#e4f3f0` | accent on it passes AA |
| focus | `#0b6e64` | UI 3:1 passes |
| on-accent | `#ffffff` | passes on accent and hover |

`python3 replica/tools/contrast.py replica/design/tokens.json`: 32 pairs,
**0 failing AA** (run 2026-11-24). Deck themes (Paper, Ink, Meadow, Ember,
Slate, Mono) are our own and unchanged.

## Logo brief

- **Idea:** a single card with its corner folded down: flat, open, nothing
  hidden. The fold doubles as a quiet "done" mark. Ties to *fair* (what you
  see is what you get) and to *deck* (cards).
- **Mark type:** symbol plus wordmark; the symbol alone works as the app icon.
- **Placeholder in the app now:** `src/components/app/logo.tsx` and
  `src/app/icon.svg`, a simple folded card in teal. Replace with the
  finished mark.
- **Must work at** 16px (favicon: fold and two lines must stay legible, drop
  the lines below 20px if needed) and as a 1024px app icon.
- **Deliverables:** SVG (mark, wordmark, lockup; light and dark), app icon
  1024×1024 with no transparency for iOS, favicon set (16, 32, 180 apple-touch,
  512 maskable), social image 1200×630.
- **Wordmark:** a humanist sans (Inter or similar open font), sentence case
  "Fairdeck", no ligature tricks.
- **Must not resemble the original's mark:** no Greek letterforms, no
  swirls, no purple or violet gradient, no shared shape or colour pair. Put
  the original's logo next to every draft and check before approving.

## Voice

**Plain, upfront, warm.**

- *Plain*, not dull: short words, one idea per sentence, still with some life.
- *Upfront*, not blunt: say the cost, the limit and the catch before anyone asks, kindly.
- *Warm*, not cute: we sound like a helpful colleague, not a mascot. No exclamation-mark confetti.

| do | don't |
| --- | --- |
| "This deck uses 25 of your 400 credits." | "Unlock the magic with credits ✨" |
| "That broke on our side, not yours." | "Oops! Something went wrong :(" |
| "Build from my outline, free" | "Upgrade now to continue" as the only way out |
| "Decks in the trash are deleted after 30 days." | "Are you sure?? This might be permanent" |
| "We lay out your outline as it is, at no cost." | "Our AI-powered engine revolutionises your workflow" |

### The ten most-seen strings, in this voice

All written fresh for this product.

| where | before | now |
| --- | --- | --- |
| sign-up heading | Make your first deck free | Start with 400 free credits |
| sign-up line | You start with 400 AI credits. No card needed. | You see the cost of every deck before you make it. No card needed. |
| create heading | What do you want to make? | What are we making? |
| main button | Generate deck | Make my deck |
| cost line | (none) | Uses 25 of 400 |
| out of credits title | You need a few more credits | Not enough credits for AI writing |
| out of credits way out | See plans | Build from my outline, free (primary) · See plans |
| empty dashboard | Your first deck is one sentence away | unchanged, already in voice |
| server error | Something went wrong on our side. | That broke on our side, not yours. Try again in a moment. |
| tagline | Turn an idea into a finished presentation in a minute. | Presentations in a minute, with the price shown before you start. |

## Sweep

`python3 replica/tools/sweep.py . --config replica/brand.json` →
**Clean. Nothing of the original's name, domain or colours found.**
(run 2026-11-24; `brand.json` avoids the original's name and domain, plus the
old placeholder accent colours.)

By eye: page titles read "… · Fairdeck" (checked on `/login`), favicon is
`/icon.svg` (200, image/svg+xml), email templates use `APP_NAME`, the logo
component shows the new mark. Still to do at launch: OG image, iOS app icon,
the support address on your real domain (`SUPPORT_EMAIL`), and the original's
exact brand colours added to `brand.json` once checked by hand.
