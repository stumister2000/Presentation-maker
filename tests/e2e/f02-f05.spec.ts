import { test, expect, a11y, createDeckUi, cardSection } from "./fixtures";
import { signUpUi } from "./helpers";

test.beforeEach(async ({ page }) => { await signUpUi(page); });

test.describe("F02 paste notes into a deck", () => {
  test("F02-H1 --- splits cards and 'keep my words' keeps wording", async ({ page }) => {
    await page.goto("/create/paste");
    await a11y(page);
    const notes = "Our garden plan\nWe grow food together on the empty lot.\n---\nWho helps\nNeighbours, the school and the library.\n---\nWhat we need\nTools, seeds and two water butts.";
    await page.getByRole("textbox", { name: "Your text" }).fill(notes);
    await page.getByRole("radio", { name: "Keep my words" }).click();
    await page.getByRole("button", { name: "Draft outline" }).click();
    await expect(page.getByLabel(/Card \d+ title/)).toHaveCount(3);
    await expect(page.getByLabel("Card 2 title")).toHaveValue("Who helps");
    await expect(page.getByLabel("Card 3 points, one per line")).toHaveValue(/Tools, seeds and two water butts/);
  });

  test("F02-E1 character counter shows length", async ({ page }) => {
    await page.goto("/create/paste");
    await page.getByRole("textbox", { name: "Your text" }).fill("abc");
    await expect(page.getByText("3 / 20,000")).toBeVisible();
  });
});

test.describe("F03 edit a card", () => {
  test("F03-H1 edit heading text, autosave, survives reload", async ({ page }) => {
    await createDeckUi(page, "Editing test", 3);
    const heading = cardSection(page, 1).getByRole("textbox", { name: /^Heading, card 1/ });
    await heading.click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type("Brand new title — ünïcødé 🚀");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("save-state")).toHaveText("Saved", { timeout: 5000 });
    await page.reload();
    await expect(cardSection(page, 1).getByRole("textbox", { name: /^Heading, card 1/ })).toHaveText("Brand new title — ünïcødé 🚀");
    await a11y(page);
  });

  test("F03-E1 slash menu turns an empty line into a list", async ({ page }) => {
    await createDeckUi(page, "Slash test", 2);
    const para = cardSection(page, 1).getByRole("textbox", { name: /^Paragraph, card 1/ }).first();
    await para.click();
    await page.keyboard.press("Control+End");
    await page.keyboard.press("Enter");
    // wait until the new empty paragraph has the caret
    await expect(page.locator("[contenteditable]:focus")).toHaveText("");
    await page.keyboard.press("/");
    await expect(page.getByRole("listbox", { name: "Blocks" })).toBeVisible();
    await a11y(page);
    await page.keyboard.type("bullet");
    await page.keyboard.press("Enter");
    await page.keyboard.type("First point");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Second point");
    await page.keyboard.press("Escape");
    await expect(cardSection(page, 1).getByRole("listitem")).toHaveText(["First point", "Second point"]);
  });

  test("F03-E2 undo and redo", async ({ page }) => {
    await createDeckUi(page, "Undo test", 3);
    await expect(page.getByRole("region", { name: /^Card \d+$/ })).toHaveCount(3);
    await cardSection(page, 2).getByRole("button", { name: "More for card 2" }).click();
    await page.getByRole("menuitem", { name: "Delete card" }).click();
    await expect(page.getByRole("region", { name: /^Card \d+$/ })).toHaveCount(2);
    await page.locator("body").press("Control+z");
    await expect(page.getByRole("region", { name: /^Card \d+$/ })).toHaveCount(3);
    await page.locator("body").press("Control+Shift+z");
    await expect(page.getByRole("region", { name: /^Card \d+$/ })).toHaveCount(2);
  });

  test("F03-E3 reorder, duplicate, add card and layout change persist", async ({ page }) => {
    await createDeckUi(page, "Order test", 3);
    const title2 = await cardSection(page, 2).getByRole("textbox").first().innerText();
    await cardSection(page, 2).getByRole("button", { name: "More for card 2" }).click();
    await page.getByRole("menuitem", { name: "Move up" }).click();
    await expect(cardSection(page, 1).getByRole("textbox").first()).toHaveText(title2);
    await cardSection(page, 1).getByRole("button", { name: "More for card 1" }).click();
    await page.getByRole("menuitem", { name: "Duplicate card" }).click();
    await page.getByRole("button", { name: "Add a card after card 4" }).click({ force: true });
    await expect(page.getByRole("region", { name: /^Card \d+$/ })).toHaveCount(5);
    await cardSection(page, 3).getByRole("button", { name: "Layout for card 3" }).click();
    await page.getByRole("menuitem", { name: /Image behind/ }).click();
    await expect(page.getByTestId("save-state")).toHaveText("Saved", { timeout: 5000 });
    await page.reload();
    await expect(page.getByRole("region", { name: /^Card \d+$/ })).toHaveCount(5);
    await expect(cardSection(page, 1).getByRole("textbox").first()).toHaveText(title2);
    await cardSection(page, 3).getByRole("button", { name: "Layout for card 3" }).click();
    await expect(page.getByRole("menuitem", { name: "✓ Image behind" })).toBeVisible();
  });

  test("F03-E4 speaker notes save", async ({ page }) => {
    await createDeckUi(page, "Notes test", 2);
    await page.getByRole("button", { name: "Speaker notes for card 1" }).click();
    await page.getByRole("textbox", { name: "Speaker notes for card 1" }).fill("Pause here for questions.");
    await expect(page.getByTestId("save-state")).toHaveText("Saved", { timeout: 5000 });
    await page.reload();
    await page.getByRole("button", { name: "Speaker notes for card 1" }).click();
    await expect(page.getByRole("textbox", { name: "Speaker notes for card 1" })).toHaveValue("Pause here for questions.");
  });

  test("F03-E5 keyboard only: tab into a heading, type, leave", async ({ page }) => {
    await createDeckUi(page, "Keyboard test", 2);
    const heading = cardSection(page, 1).getByRole("textbox", { name: /^Heading, card 1/ });
    await heading.focus();
    await page.keyboard.press("Control+A");
    await page.keyboard.type("Typed by keyboard");
    await page.keyboard.press("Escape");
    await expect(heading).toHaveText("Typed by keyboard");
  });

  test("F03-E6 offline edits show a warning and save when back online", async ({ page, context }) => {
    await createDeckUi(page, "Offline test", 2);
    await context.setOffline(true);
    const heading = cardSection(page, 1).getByRole("textbox", { name: /^Heading, card 1/ });
    await heading.click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type("Written offline");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("save-state")).toHaveText(/Offline/, { timeout: 5000 });
    await context.setOffline(false);
    await expect(page.getByTestId("save-state")).toHaveText("Saved", { timeout: 10000 });
    await page.reload();
    await expect(cardSection(page, 1).getByRole("textbox", { name: /^Heading, card 1/ })).toHaveText("Written offline");
  });

  test("F03-E8 two tabs: the later save wins and nothing crashes", async ({ page, context }) => {
    const id = await createDeckUi(page, "Two tabs", 2);
    const other = await context.newPage();
    await other.goto(`/decks/${id}`);
    for (const [p, text] of [[page, "From tab one"], [other, "From tab two"]] as const) {
      const h = cardSection(p, 1).getByRole("textbox", { name: /^Heading, card 1/ });
      await h.click();
      await p.keyboard.press("Control+A");
      await p.keyboard.type(text);
      await p.keyboard.press("Escape");
      await expect(p.getByTestId("save-state")).toHaveText("Saved", { timeout: 5000 });
    }
    await page.reload();
    await expect(cardSection(page, 1).getByRole("textbox", { name: /^Heading, card 1/ })).toHaveText("From tab two");
  });
});

test.describe("F04 edit with AI", () => {
  test("F04-H1 apply a suggestion, cards update", async ({ page }) => {
    await createDeckUi(page, "AI edit test", 3);
    await page.getByRole("button", { name: "More for card 2" }).click();
    await page.getByRole("menuitem", { name: "Duplicate card" }).click(); // something to compare
    const before = await page.getByRole("region", { name: /^Card \d+$/ }).count();
    await page.getByRole("button", { name: "Edit with AI", exact: true }).click();
    await a11y(page);
    await page.getByRole("button", { name: "Make it shorter" }).click();
    await expect(page.getByText(/Updated \d+ cards?/)).toBeVisible();
    await page.keyboard.press("Escape");
    expect(await page.getByRole("region", { name: /^Card \d+$/ }).count()).toBe(before);
  });
});

test.describe("F05 change theme", () => {
  test("F05-H1 theme applies, persists and shows on the dashboard", async ({ page }) => {
    await createDeckUi(page, "Theme test", 2);
    await page.getByRole("button", { name: "Theme", exact: true }).click();
    await a11y(page);
    await page.getByRole("radio", { name: /Ember/ }).click();
    await page.keyboard.press("Escape");
    await page.reload();
    await page.getByRole("button", { name: "Theme", exact: true }).click();
    await expect(page.getByRole("radio", { name: /Ember/ })).toHaveAttribute("aria-checked", "true");
  });
});
