import { test as base, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Every UI test fails on: an uncaught page error, a console error (other than
 * the browser's own "Failed to load resource" line for an expected 4xx), or any
 * 5xx response.
 */
export const test = base.extend<{ guard: void }>({
  guard: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "error" && !/Failed to load resource: (the server responded with a status of 4\d\d|net::ERR_INTERNET_DISCONNECTED)/.test(m.text())) problems.push(`console: ${m.text()}`);
      });
      page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
      page.on("response", (r) => { if (r.status() >= 500) problems.push(`${r.status()} ${r.url()}`); });
      await use();
      expect(problems, "console errors or 5xx responses").toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

/** WCAG 2.1 A/AA scan of the current page state. */
export async function a11y(page: Page, exclude: string[] = []) {
  let b = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);
  for (const sel of exclude) b = b.exclude(sel);
  const r = await b.analyze();
  expect(r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}x e.g. ${v.nodes[0]?.target.join(" ")} — ${v.nodes[0]?.failureSummary?.split("\n")[1]?.trim() ?? ""}`)).toEqual([]);
}

/** Creates a deck through the UI create flow and lands in the editor. */
export async function createDeckUi(page: Page, prompt = "A kickoff deck for a community garden", cards = 5) {
  await page.goto("/create/generate");
  await page.getByLabel("Number of cards").selectOption(String(cards));
  await page.getByRole("textbox", { name: "Describe your deck" }).fill(prompt);
  await page.getByRole("button", { name: "Draft outline" }).click();
  await expect(page.getByRole("button", { name: "Generate deck" })).toBeEnabled();
  await page.getByRole("button", { name: "Generate deck" }).click();
  await page.waitForURL(/\/decks\/[0-9a-f-]{36}/);
  await expect(page.getByRole("region", { name: "Card 1", exact: true })).toBeVisible();
  return page.url().split("/decks/")[1].split("?")[0];
}

export const cardSection = (page: Page, n: number) => page.getByRole("region", { name: `Card ${n}`, exact: true });
