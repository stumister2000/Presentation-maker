import { test, expect, a11y, createDeckUi } from "./fixtures";
import { signUpUi } from "./helpers";
import { readFileSync } from "node:fs";

test.describe("F06 present", () => {
  test.beforeEach(async ({ page }) => { await signUpUi(page); });

  test("F06-H1 keyboard navigation, notes and exit", async ({ page }) => {
    await createDeckUi(page, "Present test", 4);
    await page.getByRole("button", { name: "Present", exact: true }).click();
    const dlg = page.getByTestId("presenter");
    await expect(dlg).toBeVisible();
    await expect(dlg.getByText("1 / 4")).toBeVisible();
    await a11y(page);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await expect(dlg.getByText("3 / 4")).toBeVisible();
    await page.keyboard.press("End");
    await expect(dlg.getByText("4 / 4")).toBeVisible();
    await page.keyboard.press("ArrowRight"); // stays on last
    await expect(dlg.getByText("4 / 4")).toBeVisible();
    await page.keyboard.press("Home");
    await expect(dlg.getByText("1 / 4")).toBeVisible();
    await page.keyboard.press("n");
    await expect(page.getByRole("complementary", { name: "Speaker notes" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dlg).toBeHidden();
  });
});

test.describe("F07 share", () => {
  test.beforeEach(async ({ page }) => { await signUpUi(page); });

  test("F07-H1 turn the link on, a guest views it, analytics counts them", async ({ page, browser }) => {
    await createDeckUi(page, "Share test", 3);
    await page.getByRole("button", { name: "Share", exact: true }).click();
    await page.getByRole("radio", { name: "On" }).click();
    const link = await page.getByLabel("Link", { exact: true }).inputValue();
    await a11y(page);
    await page.keyboard.press("Escape");

    const guest = await browser.newContext();
    const g = await guest.newPage();
    await g.goto(link);
    await expect(g.getByRole("region", { name: /^Card \d+$/ })).toHaveCount(3);
    await expect(g.getByRole("link", { name: /Made with/ })).toHaveCount(0); // no plan badge
    await a11y(g);
    await g.waitForTimeout(3500); // first analytics beacon fires at 3s
    await g.getByRole("button", { name: "Present" }).click();
    await expect(g.getByTestId("presenter")).toBeVisible();
    await guest.close();

    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("menuitem", { name: "Analytics" }).click();
    await expect(page.getByText("Views", { exact: true })).toBeVisible();
    await expect(page.locator("dd").first()).toHaveText("1");
  });

  test("F07-N1 turning the link off locks guests out", async ({ page, browser }) => {
    await createDeckUi(page, "Lock test", 2);
    await page.getByRole("button", { name: "Share", exact: true }).click();
    await page.getByRole("radio", { name: "On" }).click();
    const link = await page.getByLabel("Link", { exact: true }).inputValue();
    await page.getByRole("radio", { name: "Off" }).click();
    await page.waitForTimeout(300);
    const g = await (await browser.newContext()).newPage();
    await g.goto(link);
    await expect(g.getByRole("heading", { name: "This deck is not available" })).toBeVisible();
  });
});

test.describe("F08 export", () => {
  test.beforeEach(async ({ page }) => { await signUpUi(page); });

  test("F08-H1 PowerPoint file downloads and is a real .pptx", async ({ page }) => {
    await createDeckUi(page, "Export test", 3);
    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("menuitem", { name: "Export" }).click();
    await a11y(page);
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /PowerPoint/ }).click()]);
    expect(dl.suggestedFilename()).toMatch(/\.pptx$/);
    const bytes = readFileSync(await dl.path());
    expect(bytes.subarray(0, 2).toString()).toBe("PK"); // zip container
    expect(bytes.length).toBeGreaterThan(10_000);
  });

  test("F08-H2 print view has one page per card", async ({ page }) => {
    const id = await createDeckUi(page, "Print test", 3);
    await page.addInitScript(() => { window.print = () => {}; });
    await page.goto(`/decks/${id}/print`);
    await expect(page.locator(".print-card")).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Print / Save PDF" })).toBeVisible();
  });
});

test.describe("F09 no sign-in", () => {
  test("F09-H1 the app opens straight to the decks, with no sign-in, credits or plans anywhere", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/home");
    await expect(page.getByRole("heading", { name: "All decks" })).toBeVisible();
    await a11y(page);
    for (const old of ["/login", "/signup", "/settings"]) {
      await page.goto(old);
      await page.waitForURL("**/home");
    }
    await expect(page.getByText(/sign in|sign up|credits|upgrade|plan/i)).toHaveCount(0);
    await expect(page.getByTestId("credits")).toHaveCount(0);
  });

  test("F09-H2 a deck link opens directly", async ({ page }) => {
    const id = await createDeckUi(page, "Direct link", 2);
    await page.goto(`/decks/${id}`);
    await expect(page.getByRole("region", { name: "Card 1", exact: true })).toBeVisible();
  });
});

test.describe("F10 organise decks", () => {
  test("F10-H1 rename, favourite, duplicate, trash, restore, delete forever, search", async ({ page }) => {
    const tag = `Org${Date.now()}`;
    await createDeckUi(page, `${tag} start`, 2);
    await page.goto("/home");
    await a11y(page);
    const menuFor = (title: string) => page.getByRole("button", { name: `Actions for ${title}`, exact: true });
    await menuFor(`${tag} start`).click();
    await page.getByRole("menuitem", { name: "Rename" }).click();
    await page.getByRole("dialog", { name: "Rename deck" }).getByLabel("Title").fill(`${tag} deck`);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("link", { name: new RegExp(`${tag} deck`) })).toBeVisible();
    await menuFor(`${tag} deck`).click();
    await page.getByRole("menuitem", { name: "Add to favourites" }).click();
    await page.getByRole("link", { name: "Favourites" }).click();
    await expect(page.getByRole("link", { name: new RegExp(`${tag} deck`) })).toBeVisible();
    await page.getByRole("link", { name: "All decks" }).click();
    await menuFor(`${tag} deck`).click();
    await page.getByRole("menuitem", { name: "Duplicate" }).click();
    await page.waitForURL(/\/decks\//);
    await page.goto("/home");
    const copy = `${tag} deck (copy)`;
    await expect(menuFor(copy)).toBeVisible();
    await page.getByLabel("Search decks").fill(`${tag} deck (copy)`);
    await expect(page.getByRole("listitem")).toHaveCount(1);
    await menuFor(copy).click();
    await page.getByRole("menuitem", { name: "Move to trash" }).click();
    await page.getByRole("link", { name: "Trash" }).click();
    await expect(menuFor(copy)).toBeVisible();
    await a11y(page);
    await menuFor(copy).click();
    await page.getByRole("menuitem", { name: "Restore" }).click();
    await expect(menuFor(copy)).toHaveCount(0);
    await page.getByRole("link", { name: "All decks" }).click();
    await menuFor(copy).click();
    await page.getByRole("menuitem", { name: "Move to trash" }).click();
    await page.getByRole("link", { name: "Trash" }).click();
    page.once("dialog", (d) => d.accept());
    await menuFor(copy).click();
    await page.getByRole("menuitem", { name: "Delete forever" }).click();
    await expect(menuFor(copy)).toHaveCount(0);
  });
});

test.describe("F12 templates", () => {
  test("F12-H1 a template becomes a deck", async ({ page }) => {
    await signUpUi(page);
    await page.goto("/templates");
    await a11y(page);
    await page.getByRole("button", { name: "Use template" }).first().click();
    await page.waitForURL(/\/decks\//);
    await expect(page.getByRole("region", { name: /^Card \d+$/ })).toHaveCount(10);
  });
});
