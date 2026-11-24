# Fixes and positioning

## Sample, stated plainly

**29 items from 2 sources**: 22 App Store reviews of the original's iOS app
(Apple's official review RSS feed, US + CA + AU, Jun–Nov 2026; 17 of them
5-star, 4 are 4-star, 1 is 1-star) and 7 Hacker News comments that give an
opinion of the product (official Algolia API, 2025–2026). Raw rows:
`replica/reviews.csv`; ranked output: `replica/feedback.md`.

That is well short of the 100+ across 3+ sources this step asks for.
G2, Capterra, Trustpilot, Google Play and Reddit could not be read from this
session (no network route, and those are to be read by a person in a
browser, not fetched). **Every theme below is thin.** Treat this as a
direction to check, not a ranking to bet on. Two of the Hacker News comments
are founders of competing tools describing feedback they heard; that is
second-hand and possibly biased, and is marked as such.

To strengthen it: read 1–3 star reviews on G2, Capterra, Trustpilot and
Google Play by hand, add rows to `replica/reviews.csv` (verbatim, with links),
and re-run `python3 replica/tools/reviews.py replica/reviews.csv --themes replica/tools/themes-presentations.json --out replica/feedback.md`.

## 1. What they hate

| # | problem | reviews | sources | evidence |
| --- | --- | --- | --- | --- |
| 1 | **Credits run out mid-deck and the work is held until you pay** | 2 | 1 (thin) | "Then we got a snag- we don’t have credits to finish  the last 5 slides." and "They have your whole idea saved and you have a decision." ([App Store, 1★, 2026-10-22](https://apps.apple.com/us/app/id6768404578?see-all=reviews), review 14696728528); "Great app but review your limits for month" ([App Store, 5★, 2026-11-16](https://apps.apple.com/us/app/id6768404578?see-all=reviews), review 14797370985) |
| 2 | **PowerPoint export needs manual fixing** | 2 | 2 (thin) | "After downloading a PPT you have to change the font of each sentence." ([App Store, 4★, 2026-08-11](https://apps.apple.com/us/app/id6768404578?see-all=reviews), review 14415123966); "They're great for web presentations, but less useful if your workflow ends in .pptx, because they're rarely 100% PowerPoint compatible." ([HN, competitor founder, second-hand](https://news.ycombinator.com/item?id=48518649)) |
| 3 | **Output looks templated, does not follow instructions** | 4 | 1 (thin, partly competitor founders) | "They rely heavily on templates, so decks look repetitive or generic quickly." ([HN](https://news.ycombinator.com/item?id=48518649)); "You describe what you want, but the output still bends toward the template instead of your instructions." ([HN](https://news.ycombinator.com/item?id=46462813), about AI slide generators in general, names the original); "slides are too cute" ([HN](https://news.ycombinator.com/item?id=45366887)); "Slides were generated via gamma obviously" ([HN](https://news.ycombinator.com/item?id=45992841)) |

## 2. What is missing

| # | request | reviews | sources | evidence |
| --- | --- | --- | --- | --- |
| 1 | Change text size for a whole slide or deck in one go | 1 | 1 (thin) | "The font size is very small and it is difficult to change." / "It would be nice if we could have the ability to change everything o that one slide" ([App Store, 4★](https://apps.apple.com/us/app/id6768404578?see-all=reviews), review 14415123966) |
| 2 | Free credits that refill, so you can come back | 1 | 1 (thin) | "Waiting for your free credits to reload as we’ve done everywhere else isn’t an option with this one either." ([App Store, 1★](https://apps.apple.com/us/app/id6768404578?see-all=reviews), review 14696728528) |
| 3 | Brand kit | 1 | 1 (thin) | "brand kit is non-negotiable for adoption" ([HN](https://news.ycombinator.com/item?id=45366887)) |
| 4 | Import and edit existing PowerPoint decks | 1 | 1 (thin, second-hand) | "They don't handle importing and editing existing PowerPoint decks well." ([HN](https://news.ycombinator.com/item?id=48518649)) |

## 3. What is unsolved

| # | group or job | reviews | sources | evidence |
| --- | --- | --- | --- | --- |
| 1 | **People trying it before paying**, who get cut off mid-project and leave for a free tool | 1 | 1 (thin) | "B- close the window and walk away to use Gemini Notebook because it’s free enough to get you started." ([App Store, 1★](https://apps.apple.com/us/app/id6768404578?see-all=reviews), review 14696728528) |
| 2 | **People whose work ends in PowerPoint** (consultants, analysts) | 2 | 2 (thin) | see hate #2 |

What users praise, so keep it: speed ("This app has saved me about 10 hours per week." — [App Store, 5★](https://apps.apple.com/us/app/id6768404578?see-all=reviews), review 14246263198; "Gamma turned presentations from a half-day job into 10 minutes" — [HN](https://news.ycombinator.com/item?id=47717530)), ease of use, and Google Slides interplay.

## Fix plan

Ranked by evidence × how cheap it is.

| # | fix | size | skill | evidence | status |
| --- | --- | --- | --- | --- | --- |
| 1 | **Never hold a deck hostage.** Out of credits? Build the deck from your own outline for free (no AI writing), keep everything you made. Exact cost shown before you start (already built). | S | build + backend | hate #1, unsolved #1 | built in this stage |
| 2 | **Daily free top-up** on the free plan (refill up to a floor each day) so trying it does not end in a wall. | S | launch (pricing) + backend | missing #2 | priced in `/replica-launch` |
| 3 | **Deck-wide text size** (S / M / L / XL) applied to every card, present mode, public view and the PowerPoint export. | S | build | missing #1, hate #2 | built in this stage |
| 4 | **Design notes the AI follows literally** on the outline step ("no bullet points", "one idea per slide", "use our terminology"). | S | build + backend | hate #3 | built in this stage |
| 5 | **Brand kit**: logo, colours, fonts saved once and used on every deck (the custom theme row, promoted). | M | design + build | missing #3 | next |
| 6 | **PowerPoint fidelity pass**: real font sizes and theme fonts in .pptx, checked in PowerPoint, Keynote, Google Slides. | M | build + test | hate #2 | next |
| 7 | **Import .pptx text** into paste mode as a first step to editing existing decks. | M | build | missing #4 | later |

Each is a row in `replica/features.csv` with `original` = `no`.

## The angle

**A. No surprise walls** (recommended)
For people who have run out of AI credits halfway through a presentation,
this app shows the exact cost before it starts and never locks your work:
out of credits, you can still finish the deck from your own outline, free.
Evidence: credits and limits, 2 reviews in 1 source (thin, but the only 1★
review in the sample and the most emotional one).

**B. Built for people who end in PowerPoint**
For people whose decks have to end up in PowerPoint, this app exports
editable slides with consistent text sizes, so nobody fixes fonts line by line.
Evidence: export fidelity, 2 reviews across 2 sources (thin). Our export is
basic today; claim this only after fix #6.

**C. Follows your brief, not a template**
For people who are tired of AI slides that all look the same, this app takes
written design notes and follows them.
Evidence: templated output, 4 items in 1 source (thin, half from competitor
founders).

**Recommendation: A.** It answers the sharpest complaint in the sample, it is
true of the product today, and it shapes pricing (fix #2) and the voice
(plain, upfront about cost). Re-check it once more reviews are in. Do not use
the original's name in the app name, ads or store listing.
