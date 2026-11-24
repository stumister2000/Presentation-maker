# Bugs

Only reproduced bugs are listed. Every fix has a test that failed first and is kept in the suite.

| ID | severity | title | status |
| --- | --- | --- | --- |
| BUG-001 | S3 | Low-contrast hint and placeholder text on dark themes | fixed in c1fa4ea |
| BUG-002 | S3 | Presenter controls below contrast minimum | fixed in c1fa4ea |
| BUG-003 | S2 | Expired session while editing shows "Offline. Retrying…" forever | fixed in c1fa4ea |
| BUG-004 | S4 | No save status at all on phones | fixed in c1fa4ea |
| BUG-005 | S3 | First characters typed into a new block are lost | fixed in c1fa4ea |
| BUG-006 | S3 | Paragraph text duplicated after editing | fixed in 96a050a |
| BUG-007 | S3 | Phone layout: artwork takes half the card, cards overflow the screen | fixed in 96a050a |
| BUG-008 | S4 | Page title briefly missing after generating a deck (double render) | fixed in the entrepreneur-stage commit |

Open S1: none. Open S2: none.

### BUG-001: Low-contrast hint and placeholder text on dark themes

- Severity: S3
- Flow / case: F01 / F01-H1 (axe scan)
- Screen: S10
- Build: 9debf5b  Browser / device: Chromium 1.63, 1440px

Steps
1. Generate a deck with the Ink theme.
2. Look at card 1 ("Use a photo instead of artwork") or any empty block placeholder.

Expected: text at least 4.5:1 against the card.
Actual: 3.66:1 (`#6c738a` on `#141a2e`), from `opacity-60` / `opacity-70` on muted text.
Evidence: axe `color-contrast` in F01-H1.
Status: fixed in c1fa4ea (muted colour at full opacity; it already passes in every theme).

### BUG-002: Presenter controls below contrast minimum

- Severity: S3
- Flow / case: F06 / F06-H1 (axe scan)
- Screen: S15
- Build: 9debf5b  Browser / device: Chromium, 1440px

Steps
1. Present any deck in the Paper theme.

Expected: the card counter and buttons readable (4.5:1).
Actual: 3.92:1; the control bar faded to 60% opacity when idle.
Evidence: axe `color-contrast` on the counter in F06-H1.
Status: fixed in c1fa4ea (no fade).

### BUG-003: Expired session while editing shows "Offline. Retrying…" forever

- Severity: S2
- Flow / case: F03 / F03-E7
- Screen: S10
- Build: 9debf5b  Browser / device: Chromium, 1440px

Steps
1. Open a deck in the editor.
2. Sign out in another tab (or let the session expire).
3. Edit a heading.

Expected: a clear "signed out" message and a way to sign back in without losing the edit.
Actual: "Offline. Retrying…" and a retry every 3 seconds that can never succeed; closing the tab loses the edit.
Evidence: F03-E7, written before the fix, failed.
Status: fixed in c1fa4ea. The editor now shows "Signed out. Changes not saved" with a "Sign in again" link that opens in a new tab, and it saves when you come back to the tab.

### BUG-004: No save status at all on phones

- Severity: S4
- Flow / case: M-H1
- Screen: S10 at 390px
- Build: 9debf5b

Steps
1. Open the editor on a phone.

Expected: some sign that changes are saved.
Actual: the status was `hidden` under 640px.
Evidence: M-H1 could not find the status.
Status: fixed in c1fa4ea (icon on phones, full text from 640px; error states always show text).

### BUG-005: First characters typed into a new block are lost

- Severity: S3
- Flow / case: F03 / F03-E1
- Screen: S10, S11
- Build: 9debf5b  Browser / device: Chromium, 1440px

Steps
1. In a paragraph, press Enter, then "/", type "bullet", press Enter.
2. Immediately type "First point", press Enter, type "Second point".

Expected: two items, "First point" and "Second point".
Actual: "irst point" and "cond point". Keystrokes landed on the page body until the new block took focus a render later.
Evidence: F03-E1 failure output.
Status: fixed in c1fa4ea (new blocks mount already editing; focus moves in a layout effect).

### BUG-006: Paragraph text duplicated after editing

- Severity: S3
- Flow / case: F03
- Screen: S10
- Build: pre-96a050a

Steps
1. Click into a paragraph, press Enter at the end, click elsewhere.

Expected: the paragraph text once.
Actual: the text twice. React reused the DOM node between the edit and view states, leaving the hand-set text node behind.
Evidence: `replica/clone-screens/S11.png` (before), regression check in the build log.
Status: fixed in 96a050a (separate keys for edit and view states). Covered now by F03-H1 and F03-E1.

### BUG-007: Phone layout: artwork takes half the card, cards overflow the screen

- Severity: S3
- Flow / case: M-H1
- Screen: S10, S18 at 390px
- Build: pre-96a050a

Expected: card fits the width, image a modest band.
Actual: artwork ~420px tall; block handles pushed cards off the right edge.
Status: fixed in 96a050a. Covered by M-H1 (no horizontal overflow).

### BUG-008: Page title briefly missing after generating a deck

- Severity: S4
- Flow / case: F01 → F03 (axe `document-title`, intermittent: a different spec failed in each of three full runs)
- Screen: S10
- Build: after a1e53c6

Steps
1. Generate a deck; the app navigates to the editor.

Expected: the tab title is the deck title throughout.
Actual: under load, the title was empty for a moment: the create flow called `router.refresh()` right after `router.push()`, rendering the editor twice.
Evidence: three full runs, three different axe `document-title` failures; isolated reruns green.
Status: fixed (redundant refresh removed); two consecutive full runs green, 55/55.

## To check (not reproduced)

- Claude engine output quality and refusal handling with a real key (only the mock was exercised).
- PPTX fidelity in PowerPoint and Keynote (the file is valid; layouts not inspected by eye).
- Autosave conflict when two people edit the same deck: last write wins, no warning. Acceptable for single-owner decks; revisit if collaboration is added.
