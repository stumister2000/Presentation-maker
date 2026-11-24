import { test, expect, a11y, createDeckUi } from "./fixtures";
import { signUpUi, generateDeckApi } from "./helpers";

test.describe("F01 generate a deck from a prompt", () => {
  test.beforeEach(async ({ page }) => { await signUpUi(page); });

  test("F01-H1 prompt → outline → deck, credits charged", async ({ page }) => {
    await a11y(page);
    await page.getByLabel("Number of cards").selectOption("5");
    await page.getByRole("textbox", { name: "Describe your deck" }).fill("Quarterly review for a small coffee roaster");
    await page.getByRole("button", { name: "Draft outline" }).click();
    await expect(page.getByRole("heading", { name: "Shape the outline" })).toBeVisible();
    await expect(page.getByLabel(/Card \d+ title/)).toHaveCount(5);
    await expect(page.getByText("Uses 25 of")).toBeVisible();
    await a11y(page);
    await page.getByRole("radio", { name: /Ink/ }).click();
    await page.getByRole("button", { name: "Generate deck" }).click();
    await page.waitForURL(/\/decks\//);
    await expect(page.getByRole("region", { name: /^Card \d+$/ })).toHaveCount(5);
    await expect(page.getByTestId("credits").first()).toHaveText("375");
    await a11y(page);
  });

  test("F01-E1 empty prompt cannot be submitted", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Draft outline" })).toBeDisabled();
    await page.getByRole("textbox", { name: "Describe your deck" }).fill("   ");
    await expect(page.getByRole("button", { name: "Draft outline" })).toBeDisabled();
  });

  test("F01-E2 accents and emoji survive into the deck title", async ({ page }) => {
    await createDeckUi(page, "Café crème ☕ pour l'équipe", 3);
    await expect(page.getByLabel("Deck title")).toHaveValue(/Café crème ☕/);
  });

  test("F01-E3 very long prompt is capped, not rejected", async ({ page }) => {
    const box = page.getByRole("textbox", { name: "Describe your deck" });
    await box.fill("x".repeat(2500));
    expect((await box.inputValue()).length).toBe(2000);
  });

  test("F01-E4 outline edits are what gets generated", async ({ page }) => {
    await page.getByRole("textbox", { name: "Describe your deck" }).fill("Onboarding for new volunteers");
    await page.getByRole("button", { name: "Draft outline" }).click();
    await expect(page.getByRole("button", { name: "Generate deck" })).toBeEnabled();
    const count = await page.getByLabel(/Card \d+ title/).count();
    await page.getByLabel("Card 2 title").fill("Where the coffee lives");
    await page.getByRole("button", { name: "Remove card 3" }).click();
    await page.getByRole("button", { name: "Move card 2 up" }).click();
    await page.getByRole("button", { name: "Generate deck" }).click();
    await page.waitForURL(/\/decks\//);
    await expect(page.getByRole("region", { name: /^Card \d+$/ })).toHaveCount(count - 1);
    await expect(page.getByRole("region", { name: "Card 1", exact: true }).getByRole("textbox").first()).toContainText("Where the coffee lives");
  });

  test("F01-E5 back from the outline keeps the prompt", async ({ page }) => {
    await page.getByRole("textbox", { name: "Describe your deck" }).fill("Keep me");
    await page.getByRole("button", { name: "Draft outline" }).click();
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByRole("textbox", { name: "Describe your deck" })).toHaveValue("Keep me");
  });

  test("F01-E6 double click on Generate makes one deck", async ({ page }) => {
    await page.getByRole("textbox", { name: "Describe your deck" }).fill("Double click test");
    await page.getByRole("button", { name: "Draft outline" }).click();
    const gen = page.getByRole("button", { name: "Generate deck" });
    await expect(gen).toBeEnabled();
    await gen.dblclick();
    await page.waitForURL(/\/decks\//);
    await page.goto("/home");
    await expect(page.getByRole("link", { name: /Double click test/ })).toHaveCount(1);
  });

  test("F01-E7 refresh in the editor right after generating keeps every card", async ({ page }) => {
    await createDeckUi(page, "Refresh test", 4);
    await page.reload();
    await expect(page.getByRole("region", { name: /^Card \d+$/ })).toHaveCount(4);
  });

  test("F01-N1 out of credits shows the upgrade prompt, not an error", async ({ page }) => {
    for (let i = 0; i < 10; i++) await generateDeckApi(page.request, "", "Drain", 10); // 400 - 10 x 40 = 0
    await page.goto("/create/generate");
    await page.getByRole("textbox", { name: "Describe your deck" }).fill("One too many");
    await page.getByRole("button", { name: "Draft outline" }).click();
    await page.getByRole("button", { name: "Generate deck" }).click();
    await expect(page.getByRole("dialog", { name: "You need a few more credits" })).toBeVisible();
    await expect(page.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/settings#plans");
  });
});
