# Component specs

Tokens: `replica/design/tokens.json` → `src/styles/tokens.css` (Tailwind 4 `@theme`).
Icons: Lucide (ISC). Fonts: Inter, Fraunces, Space Grotesk, Source Serif 4 (all OFL, self-hosted via Fontsource).
Primitives live in `src/components/ui/` and are shown together at `/design`.
All copy is written fresh for this product.

```
Button
  variants  primary, secondary, ghost, danger
  sizes     sm 32px, md 40px, lg 48px; icon-only square of the same heights
  states    default, hover, active (translateY 1px), focus-visible (2px ring focus, 2px offset), disabled (50% opacity, no pointer), loading (spinner, label kept, aria-busy)
  tokens    primary: bg accent / hover accent-hover / text on-accent; secondary: bg bg, border border, text text; ghost: transparent, hover surface; danger: bg danger, text on-accent; radius md; font sm/600
  a11y      real <button>; icon-only needs aria-label; loading sets aria-busy and disables
  used on   all
```

```
TextField / TextArea
  variants  text, email, password, search (leading icon), prompt (large textarea, xl radius)
  states    empty (placeholder text-muted), focus (ring focus), error (border danger + message below, aria-invalid, aria-describedby), disabled
  tokens    border border-input, radius md, bg bg, font base
  a11y      always a <label> (visually hidden allowed for search/prompt); error text linked by id
  used on   S01, S05, S06, S16, S22
```

```
Select
  variants  native <select> styled; Segmented (radio group as tabs)
  states    default, focus, disabled; segmented: selected (bg bg + shadow card on surface track)
  a11y      native select keeps keyboard; segmented = role radiogroup, arrows move
  used on   S05 (format, cards, language), S08 (amount, image source), S16 (link access)
```

```
Chip
  variants  suggestion (click fills prompt), choice (toggle)
  states    default, hover, selected (bg accent-soft, text accent), focus-visible
  a11y      <button>, choice chips aria-pressed
  used on   S05, S14
```

```
Modal (Dialog)
  sizes     sm 400, md 560, lg 880
  states    open (fade + scale 0.98→1, motion base), closing
  behaviour focus trapped, Esc closes, click on scrim closes, focus returns to opener; body scroll locked
  a11y      role dialog, aria-modal, aria-labelledby the title
  used on   S04, S16, S17, S23
```

```
Drawer (side panel)
  width     380px, full width under 640px
  states    open, closed
  a11y      role dialog, labelled, Esc closes
  used on   S13 theme, S14 AI edit, S19 analytics
```

```
Toast
  variants  info, success, error
  behaviour bottom-center, 4s, pause on hover, max 3 stacked
  a11y      role status (info/success) or alert (error)
  used on   all
```

```
DeckTile (dashboard)
  parts     16:10 preview (first card rendered at 0.25 scale in its theme), title, edited time, ⋯ menu
  states    default, hover (shadow pop, ⋯ visible), focus-visible, loading skeleton
  menu      open, rename, duplicate, favourite, move to trash / restore, delete forever (trash only)
  a11y      the tile is a link; the ⋯ menu is a separate button with aria-haspopup=menu
  used on   S03, S20, S24
```

```
Card (slide)
  layouts   none, accent_left, accent_right, accent_top, background (image behind, scrim for contrast)
  sizes     fluid (min-height 16:9 of width, grows), 16x9, 4x3 fixed
  states    editing (selected outline accent), presenting (no chrome), thumbnail (scaled)
  tokens    from the deck theme: page, card, text, muted, accent; heading font per theme
  used on   S09, S10, S15, S18
```

```
Block (inside a card)
  kinds     heading (h1/h2/h3), paragraph, bullets, numbered, quote, callout (info/tip/warning), image, columns (2–3 of paragraphs/bullets), divider, button (link), stat (big number + label)
  states    hover (drag handle + ⋯ at left), focused (caret), empty (placeholder "Type / for blocks")
  a11y      semantic tags (h1/h2/ul/ol/blockquote/figure)
  used on   S10, S15, S18
```

```
InsertMenu (+ and /)
  parts     search input, grouped list with icon, name, hint
  behaviour arrow keys move, Enter inserts, Esc closes, typing filters
  a11y      role listbox with aria-activedescendant
  used on   S10
```

```
ThumbnailRail
  parts     numbered scaled cards, add-card button
  behaviour click selects + scrolls canvas; drag to reorder; ⌥↑/⌥↓ reorder with keyboard
  states    active, dragging (ghost), drop indicator
  used on   S10
```

```
OutlineItem
  parts     number, editable title, editable bullets (one per line), drag handle, delete
  states    streaming (fade in), editing, dragging
  used on   S08
```

```
ThemeSwatch
  parts     mini card in the theme (Aa heading + body line + accent bar), name
  states    default, selected (2px accent ring + check), focus-visible
  a11y      radio group
  used on   S08, S13, S21
```

```
CreditsMeter
  parts     sparkle icon + number
  states    normal, low (< 80, text warning), zero (text danger, upgrade link)
  used on   header, S08, S23
```

```
EmptyState
  parts     line icon (Lucide), title, one sentence, primary action
  used on   S03, S19, S24
```

```
Skeleton
  shimmer surface→surface-2, radius matches the thing it stands for; respects prefers-reduced-motion
  used on   S03, S09
```
