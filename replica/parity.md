# Parity report

Date: 2026-11-24. Build: after a1e53c6 (credit packs added in this stage).

**Verdict: shippable** on features — all 28 must-haves done, feature score 85.3 (≥ 80),
no open S1 or S2 bugs (`replica/bugs.md`). Not yet **better than the original**:
that needs the fixes from replica-entrepreneur.

Two honest caveats on that verdict:
1. The recon was built from prior public knowledge, not from pages read in this
   session (the sandbox could not reach gamma.app). Re-check `features.csv`
   against the live help center before trusting the score to the decimal.
2. The AI path was verified against a mock of the Messages API. Output quality
   with a real key is on the manual checklist in `replica/test-plan.md`.

| measure | score |
| --- | --- |
| Overall | 85.3 (feature score only; layout not measurable, see below) |
| Feature parity | 85.3 / 100, must-haves 28 / 28 |
| Layout parity vs the original | **not measured**: no screenshots of the original exist (`replica/screens/` is empty) |
| Layout regression, clone vs its own earlier build | S03 97.9 · S05 100 · S08 95.4 · S10 79.7 · S15 97.8 · S18 mobile 80.7 — the two "close" scores are the random per-card artwork and the new save-status in the header, not layout shifts (`replica/diffs/`) |

To get a real layout score: save 1440×900 and 390×844 screenshots of the
original from your own account into `replica/screens/S03.png` etc., then run
`python3 replica/tools/imgdiff.py replica/screens/S10.png replica/clone-screens/S10.png --out replica/diffs/S10.png`.

## Feature parity detail

features 85.3  (57 counted, must-haves 28 of 28 done)

## By area, weakest first
- collab                         0.0  (2 features)
- api                            0.0  (1 features)
- themes                        60.0  (2 features)
- ai                            60.0  (2 features)
- sharing                       70.0  (5 features)
- export                        83.3  (3 features)
- analytics                     83.3  (2 features)
- editor                        88.2  (14 features)
- dashboard                     88.9  (4 features)
- create                        92.1  (8 features)
- outline                       92.3  (5 features)
- auth                         100.0  (2 features)
- generate                     100.0  (1 features)
- billing                      100.0  (3 features)
- present                      100.0  (2 features)
- templates                    100.0  (1 features)

## Missing, in build order
- [should] ai: AI generate an image for a card, no
- [should] sharing: Invite collaborators by email, no
- [should] themes: Custom theme (fonts colours logo), no
- [should] create: Choose format presentation or document, partial  (format stored; both render as cards)
- [should] editor: Columns and smart layouts, partial  (columns + big numbers; no diagram layouts yet)
- [should] outline: Pick image source (AI / stock / none), partial  (stock photos (Unsplash) + theme artwork + none; no AI-generated images)
- [could] api: Public developer API, no
- [could] collab: Comments on cards, no
- [could] collab: Realtime multiplayer editing, no  (deferred)
- [could] dashboard: Folders, no
- [could] editor: Tables and charts, no
- [could] editor: Version history, no
- [could] editor: Video and web embeds, no
- [could] export: Export to PNG, no
- [could] sharing: Password protect a link, no  (paid)
- [could] analytics: Per-card engagement analytics, partial  (cards seen per viewer, not per card)
- [could] create: Import pptx / docx / pdf / URL, partial  (.txt and .md only)

## Left out on purpose (not scored)
- Gamma's own themes and template designs: their design work; we make our own
- Licensed image model / stock partners: use our own providers under their terms
- Public gallery and user network: the network is not rebuildable
- Google Slides / Canva partner export: partner deals
- Custom domains for published sites at scale: basic version later if needed

## Behaviour differences

| flow | original does (from recon) | clone does | fix or keep |
| --- | --- | --- | --- |
| F01 core loop, clicks | ~5 clicks: Create new → Generate → prompt → (theme) → Generate | 5 clicks; right after sign-up it lands on the prompt, so the first deck takes 3 | keep |
| F01 cost visibility | credits shown before generating | exact cost shown next to the Generate button ("Uses 25 of 400") | keep |
| F01 failure | (unknown) | partial decks kept, undelivered credits refunded automatically | keep |
| F03 save state | autosave indicator | autosave + distinct "offline, retrying" and "signed out" states | keep |
| F03 offline | (unknown) | edits queue and save when back online | keep |
| F04 AI edit | chat-style AI panel | instruction box + one-click suggestions, whole deck or one card, undoable | keep; add multi-turn chat later |
| F06 present | presenter mode | same, plus speaker notes panel (N), Home/End jumps | keep |
| F07 share | view / comment / edit links, invites | view link on/off only | build invites + comment access (should) |
| F08 export | PDF, PPTX, PNG, Google Slides | PDF (print view), PPTX | PNG later (could) |
| F09 sign-in | email, Google | email + password, magic link, Google | keep |
| F11 upgrade | plans + credits | plans + one-off 500-credit pack, cancel in one click in the Stripe portal | keep |
| emails | sign-up, sharing | verify, magic link, reset, payment failed | add "someone shared a deck with you" with invites |

## Top five to build next

1. **Invite collaborators by email + comment access** (sharing, should). Biggest remaining gap for teams; needs an `invites` table and share emails.
2. **Custom themes** (themes, should): fonts, colours and logo, stored in the existing `themes` table.
3. **AI-generated images** (ai, should): add an image model behind `decorateCard`; keep Unsplash as the default.
4. **Document format that reads like a document** (create, should): pageless layout without card frames.
5. **Diagram layouts** (editor, should): timeline, process and comparison blocks.

Then the fixes from `/replica-entrepreneur`, which is where "better than the original" comes from.
