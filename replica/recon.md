# Recon map: Gamma (web)

Scope: the core loop — prompt or pasted text → editable AI outline → generated
card-based presentation → edit (blocks, layouts, themes, AI edits) → present,
share by link, export. Documents/webpages/social formats are secondary.
For: the repo owner's own presentation-maker product (sell as a SaaS).
Date: 2026-11-24

> **Evidence caveat.** This session's sandbox could not read gamma.app,
> help.gamma.app or developers.gamma.app (network and fetch permissions
> blocked the reads). Everything below comes from prior public knowledge of
> the product (marketing site, help center, public API docs, public
> walkthroughs) and is marked with a confidence. Re-verify every row marked
> `medium` or `guess` against the live sources before treating it as fact.
> No account was used, no code or network calls of the app were inspected.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | marketing site | https://gamma.app/ | positioning, output formats. Not readable this session. |
| 2 | pricing page | https://gamma.app/pricing | plans, credits, gated features. Not readable this session. |
| 3 | help center | https://help.gamma.app/ | create flows, editor, share, export. Not readable this session. |
| 4 | public API docs | https://developers.gamma.app/ | generate endpoint parameters = the settings model. Not readable this session. |
| 5 | templates gallery | https://gamma.app/templates | template-to-gamma flow. Not readable this session. |
| 6 | public walkthrough videos | https://www.youtube.com/results?search_query=gamma+app+tutorial | click-by-click flows. Not watched this session. |
| 7 | user's own account | (none used) | Not used. Recommended next: drive it yourself and fill screenshots into `replica/screens/`. |

## Core loop

Type one line (or paste notes), approve an editable outline, and get a
fully designed, themed, image-filled card deck in under a minute that you can
then edit, present and share as a live link.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Sign up / log in | /signup, /signin | account | email field, Google button, magic link | empty, error, loading |
| S02 | Onboarding | first login | role + use case, workspace name | choice chips, text input | filled |
| S03 | Home dashboard | /  (app home) | list gammas, start new | sidebar (folders, templates, themes, trash), tabs (All/Recent/Created by you/Favorites), card grid / list toggle, "Create new" button, search | empty (first run), filled, loading |
| S04 | Create picker | "Create new" | choose start method | 3–4 big tiles: Generate, Paste in text, Import file/URL, (Remix a template) | — |
| S05 | Generate prompt | /create/generate | prompt + basic settings | format tabs (Presentation/Webpage/Document/Social), card count select, language select, prompt textarea, example prompt chips, "Generate outline" | empty, typing, loading |
| S06 | Paste in text | /create/paste | turn existing notes into a gamma | big textarea, mode: generate / condense / preserve | empty, filled |
| S07 | Import | /create/import | file (pptx, docx, pdf) or URL | dropzone, URL input | uploading, error |
| S08 | Outline editor | after S05/S06 | edit what will be generated | numbered card outline (title + bullets), drag reorder, add/delete card, "cards" count, settings: text amount, audience, tone, image source & style, theme grid, card dimensions, credits cost, "Generate" | streaming outline, filled, out of credits |
| S09 | Generating | after "Generate" | progress | cards appearing one by one, skeletons | streaming, failed |
| S10 | Editor | /docs/:slug | edit the gamma | top bar (title, theme, share, present, ⋯), left card thumbnail rail, card canvas, floating "+" insert, block hover handles, card ⋯ menu (layout, background, duplicate, delete), AI button | filled, saving, offline |
| S11 | Insert / slash menu | "+" or "/" in editor | add blocks | categories: text (heading, bullets, numbered, todo, quote, callout), layout (columns, smart layouts/diagrams), media (image, video, embed), data (table, chart), buttons | search filtered, empty results |
| S12 | Card layout panel | card ⋯ → layout | accent image position, card width/background | layout thumbnails (accent left/right/top/background/none), color swatches | — |
| S13 | Theme panel | top bar → Theme | restyle whole deck | theme grid with live previews, search, custom theme button | selected |
| S14 | AI edit panel | "AI" / Edit with AI | rewrite, shorten, translate, add images, restyle | chat input, suggestion chips, apply/undo | thinking, applied, error |
| S15 | Present mode | "Present" | fullscreen slideshow | card view, arrow nav, progress, exit, presenter notes | first card, last card |
| S16 | Share modal | "Share" | access control | link access dropdown (no access/view/comment/edit), invite by email, copy link, embed code, password (paid) | — |
| S17 | Export modal | Share → Export / ⋯ | download | PDF, PPTX, PNG, Google Slides options | exporting, done, failed |
| S18 | Public view | /docs/:slug (as guest) | read-only scrolling doc / present | cards, "Made with Gamma" badge (free), present button | no access (403), filled |
| S19 | Analytics | ⋯ → Analytics | who viewed | total views, unique viewers, per-card engagement | empty, filled |
| S20 | Templates gallery | sidebar → Templates | start from a template | template grid, categories, "Use template" | — |
| S21 | Themes gallery / editor | sidebar → Themes | browse + create custom theme | theme grid, editor (fonts, colors, logo, background) | — |
| S22 | Settings | avatar → Settings | account, workspace, members, billing | tabs, forms | — |
| S23 | Upgrade / credits modal | out of credits, upgrade CTA | monetisation | plan cards, credit balance | — |
| S24 | Trash | sidebar → Trash | restore / delete forever | list | empty, filled |

## Flows

```
F01 Generate a presentation from a prompt  (THE core loop)
    S03 -> S04 -> S05 -> S08 -> S09 -> S10
    happy path clicks: 5  (Create new, Generate, type prompt + Generate outline, pick theme, Generate)
    edge: empty prompt, out of credits, AI fails mid-stream, user edits outline while it streams,
          >max cards for plan, non-English language

F02 Turn pasted notes into a deck
    S03 -> S04 -> S06 -> S08 -> S09 -> S10
    happy path clicks: 5
    edge: very long text (truncate/condense), "preserve" mode keeps wording, card split on ---

F03 Edit a card
    S10 -> S11 (insert block) / S12 (layout) / inline text editing
    edge: undo/redo, delete last card, drag reorder cards, autosave failure

F04 Rewrite with AI
    S10 -> S14 -> apply
    edge: undo AI change, out of credits

F05 Restyle with a theme
    S10 -> S13 -> click theme
    happy path clicks: 2

F06 Present
    S10 -> S15 -> arrows -> Esc
    edge: first/last card, mobile, keyboard only

F07 Share a view link and a guest opens it
    S10 -> S16 -> set "anyone with link can view" -> copy -> (guest) S18
    edge: link access off -> guest sees no-access page; comment/edit access

F08 Export
    S10 -> S17 -> PDF | PPTX -> download
    edge: big deck, images fail to load, free plan watermark

F09 Sign up and land on an empty dashboard
    S01 -> S02 -> S03 (empty state with "Create new")

F10 Organise: rename, duplicate, favourite, move to folder, trash, restore
    S03 card ⋯ -> action ; S24 restore

F11 Run out of credits and upgrade
    S08 Generate -> S23 -> Stripe checkout -> back to S08

F12 Start from a template
    S20 -> Use template -> S10
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary (gradient/brand), secondary, ghost, danger, icon | default, hover, focus, disabled, loading | all |
| Text input / textarea | single, multi, prompt (large) | empty, focus, error, disabled | S01, S05, S06, S16 |
| Select / dropdown | native-like, segmented tabs | open, closed | S05, S08, S16 |
| Chip | suggestion, filter, choice | default, selected | S02, S05, S14 |
| Modal | small, large, fullscreen | open, closing | S04, S16, S17, S23 |
| Side panel | right drawer | open, closed | S13, S14, S19 |
| Toast | success, error, info | — | all |
| Gamma tile | grid card, list row | hover (⋯), selected | S03, S20, S24 |
| Card (slide) | with accent image L/R/top/bg, none; widths | editing, selected, presenting | S09, S10, S15, S18 |
| Thumbnail rail item | — | active, dragging | S10 |
| Outline item | card title + bullets | editing, dragging | S08 |
| Theme swatch tile | — | selected | S08, S13, S21 |
| Block: heading, paragraph, bullets, numbered, quote, callout, image, columns, table, divider, button, smart layout | — | hover handle, selected | S10 |
| Floating format toolbar | text selection | — | S10 |
| Skeleton / shimmer | card, tile | — | S03, S09 |
| Avatar / user menu | — | — | header |
| Empty state | dashboard, trash, analytics | — | S03, S19, S24 |
| Credits meter | — | low, zero | S08, S23, header |

## Inferred data model

```
User        id, email, name, avatar_url, created_at
            evidence: S01, S22            confidence: high

Workspace   id, name, plan (free|plus|pro|team), credits_balance, created_at
            evidence: S22, S23, pricing page (credits are per account/workspace)
            confidence: medium

Membership  user_id, workspace_id, role (owner|admin|member)
            evidence: S22 members tab        confidence: medium

Folder      id, workspace_id, name           evidence: S03 sidebar     confidence: medium

Gamma       id, workspace_id, folder_id?, created_by, title, slug,
            format (presentation|document|webpage|social),
            theme_id, dimensions (fluid|16x9|4x3|letter|a4|1x1|4x5|9x16),
            link_access (none|view|comment|edit), is_favorite (per user),
            archived_at (trash), created_at, updated_at
            evidence: S03, S10, S16, API generate params (format, cardOptions.dimensions, sharingOptions)
            confidence: high

Card        id, gamma_id, position, layout (accent_left|accent_right|accent_top|background|none),
            accent_image_url?, background?, content (JSON block tree), notes, created_at
            evidence: S10, S12, S15 presenter notes      confidence: high (shape), guess (storage as JSON)

Theme       id, workspace_id? (null = built-in), name, fonts {heading, body},
            colors {bg, card, text, heading, accent, link}, radius, logo_url?
            evidence: S13, S21, API themeId           confidence: high

Generation  id, workspace_id, user_id, gamma_id?, source (prompt|paste|import|api),
            input_text, settings JSON {numCards, textMode, textAmount, tone, audience,
            language, imageSource, imageStyle, themeId, dimensions}, outline JSON,
            status (outline|generating|completed|failed), credits_used, created_at
            evidence: S05, S08, API generate + status endpoints      confidence: high

CreditLedger id, workspace_id, delta, reason (signup|generation|ai_edit|image|purchase|refill), ref_id
            evidence: credits shown on S08/S23   confidence: guess

Invite      id, gamma_id, email, role (view|comment|edit)   evidence: S16   confidence: high
Comment     id, gamma_id, card_id, user_id, body, resolved   evidence: editor comments   confidence: medium
View        id, gamma_id, viewer_id?, session_id, card_id, seconds, created_at
            evidence: S19 per-card engagement    confidence: medium
Version     id, gamma_id, snapshot JSON, created_at   evidence: version history   confidence: medium
ExportJob   id, gamma_id, kind (pdf|pptx|png), status, url   evidence: S17, API exportAs   confidence: medium
Template    a Gamma flagged is_template + category   evidence: S20   confidence: guess
```

Relationships: User n-n Workspace (Membership); Workspace 1-n Folder, Gamma,
Theme (custom), Generation, CreditLedger; Gamma 1-n Card, Invite, Comment,
View, Version, ExportJob; Theme 1-n Gamma.

## Feature matrix

See `features.csv`. Must: 28, should: 16, could: 13, skip: 5.

## Out of scope (cannot or should not be cloned)

- Gamma's built-in theme designs, template library content, illustrations and
  logo — we design our own themes and templates.
- Their AI image partners' licensed models and stock libraries — we use our own
  providers (e.g. Unsplash API under its own terms, an image model we pay for).
- The user base / public gallery of gammas, and "Made with Gamma" virality.
- Partner integrations (their Google Slides / Canva arrangements, Zapier app).
- Gamma Sites custom-domain hosting network at their scale (we can do a basic version).

## Size

Screens 24, flows 12, entities 13. Hard parts:
1. **Streaming structured AI generation** (outline then cards, as JSON blocks, with images) and keeping it cheap.
2. **The block-based card editor** (inline rich text, layouts, drag reorder, autosave) — this is most of the product feel.
3. **Faithful export to PPTX/PDF** from a fluid, themed card layout.
Also: themes that restyle everything live, realtime collaboration (deferred).

Size: **L** for the full slice; the vertical slice (F01 + F03 + F05 + F06 + F07) is **M**.
