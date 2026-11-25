import { test, expect, a11y, createDeckUi, cardSection } from "./fixtures";
import { signUpUi } from "./helpers";

// Fixes that came out of replica-entrepreneur (replica/fixes.md).
test.beforeEach(async ({ page }) => { await signUpUi(page); });

test("X1-H1 'use my outline as written' builds the deck from my words, no AI", async ({ page }) => {
  await page.getByRole("textbox", { name: "Describe your deck" }).fill("My big idea");
  await page.getByRole("button", { name: "Draft outline" }).click();
  await expect(page.getByRole("button", { name: "Make my deck" })).toBeEnabled();
  await page.getByLabel("Card 1 title").fill("My own title, kept exactly");
  await page.getByRole("button", { name: "Use my outline as written (no AI)" }).click();
  await page.waitForURL(/\/decks\//);
  await expect(cardSection(page, 1).getByRole("textbox").first()).toHaveText("My own title, kept exactly");
});

test("X2-H1 deck-wide text size applies everywhere and persists", async ({ page }) => {
  await createDeckUi(page, "Text size test", 2);
  const heading = cardSection(page, 1).getByRole("textbox", { name: /^Heading, card 1/ });
  const before = await heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  await page.getByRole("button", { name: "Theme", exact: true }).click();
  await page.getByRole("radio", { name: "XL" }).click();
  await page.keyboard.press("Escape");
  const after = await heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(after / before).toBeGreaterThan(1.25);
  await page.reload();
  const reloaded = await cardSection(page, 1).getByRole("textbox", { name: /^Heading, card 1/ }).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(Math.round(reloaded)).toBe(Math.round(after));
});

test("X3-H1 design notes field is on the outline step", async ({ page }) => {
  await page.getByRole("textbox", { name: "Describe your deck" }).fill("Notes test");
  await page.getByRole("button", { name: "Draft outline" }).click();
  await page.getByLabel("Design notes (optional)").fill("One idea per card.");
  await expect(page.getByLabel("Design notes (optional)")).toHaveValue("One idea per card.");
  await a11y(page);
});
