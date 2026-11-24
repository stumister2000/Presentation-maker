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
    await expect(g.getByRole("link", { name: /Made with/ })).toBeVisible(); // free plan badge
    await a11y(g);
    await g.waitForTimeout(3500); // first analytics beacon fires at 3s
    await g.getByRole("button", { name: "Present" }).click();
    await expect(g.getByTestId("presenter")).toBeVisible();
    await guest.close();

    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("menuitem", { name: "Analytics" }).click();
    await expect(page.getByText("Viewers")).toBeVisible();
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

test.describe("F09 sign up and sign in", () => {
  test("F09-H1 sign up lands on the create screen with a welcome note", async ({ page }) => {
    await page.goto("/signup");
    await a11y(page);
    await signUpUi(page);
    await expect(page.getByText(/Welcome! You have 400 credits/)).toBeVisible();
  });

  test("F09-N1 wrong password, duplicate email, bad email", async ({ page }) => {
    const email = await signUpUi(page);
    await page.getByRole("button", { name: "Account" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await page.waitForURL("**/login");
    await expect(page).toHaveTitle(/Sign in/);
    await a11y(page);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "That email and password do not match." })).toBeVisible();
    await page.goto("/signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "An account with that email already exists." })).toBeVisible();
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  });

  test("F09-E1 signed-out visit to a deck goes to login and comes back", async ({ page, context }) => {
    const id = await (async () => { await signUpUi(page); return createDeckUi(page, "Return test", 2); })();
    const email = await page.request.get("/api/auth/me").then((r) => r.json()).then((u) => u.email);
    await context.clearCookies();
    await page.goto(`/decks/${id}`);
    await page.waitForURL(/\/login\?next=/);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(`**/decks/${id}`);
  });

  test("F09-E2 forgot password page works", async ({ page }) => {
    await page.goto("/reset");
    await a11y(page);
    await page.getByLabel("Email").fill("someone@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("status")).toContainText("If that address has an account");
  });
});

test.describe("F10 organise decks", () => {
  test("F10-H1 rename, favourite, duplicate, trash, restore, delete forever, search", async ({ page }) => {
    await signUpUi(page);
    await createDeckUi(page, "Organise me", 2);
    await page.goto("/home");
    await a11y(page);
    const menu = () => page.getByRole("button", { name: /^Actions for / }).first();
    await menu().click();
    await page.getByRole("menuitem", { name: "Rename" }).click();
    await page.getByRole("dialog", { name: "Rename deck" }).getByLabel("Title").fill("Renamed deck");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("link", { name: /Renamed deck/ })).toBeVisible();
    await menu().click();
    await page.getByRole("menuitem", { name: "Add to favourites" }).click();
    await page.getByRole("link", { name: "Favourites" }).click();
    await expect(page.getByRole("link", { name: /Renamed deck/ })).toBeVisible();
    await page.getByRole("link", { name: "All decks" }).click();
    await menu().click();
    await page.getByRole("menuitem", { name: "Duplicate" }).click();
    await page.waitForURL(/\/decks\//);
    await page.goto("/home");
    await expect(page.getByRole("link", { name: /Renamed deck \(copy\)/ })).toBeVisible();
    await page.getByLabel("Search decks").fill("copy");
    await expect(page.getByRole("listitem")).toHaveCount(1);
    await page.getByRole("button", { name: /^Actions for Renamed deck \(copy\)/ }).click();
    await page.getByRole("menuitem", { name: "Move to trash" }).click();
    await page.getByRole("link", { name: "Trash" }).click();
    await expect(page.getByRole("link", { name: /Renamed deck \(copy\)/ })).toBeVisible();
    await a11y(page);
    await page.getByRole("button", { name: /^Actions for / }).click();
    await page.getByRole("menuitem", { name: "Restore" }).click();
    await expect(page.getByRole("heading", { name: "The trash is empty" })).toBeVisible();
    await page.getByRole("link", { name: "All decks" }).click();
    await page.getByRole("button", { name: /^Actions for Renamed deck \(copy\)/ }).click();
    await page.getByRole("menuitem", { name: "Move to trash" }).click();
    await page.getByRole("link", { name: "Trash" }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /^Actions for / }).click();
    await page.getByRole("menuitem", { name: "Delete forever" }).click();
    await expect(page.getByRole("heading", { name: "The trash is empty" })).toBeVisible();
  });
});

test.describe("F11 plans", () => {
  test("F11-H1 plans are listed and the current plan is marked", async ({ page }) => {
    await signUpUi(page);
    await page.goto("/settings#plans");
    await a11y(page);
    await expect(page.getByRole("heading", { name: "Plan and credits" })).toBeVisible();
    await expect(page.getByText("Current")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Upgrade to Plus" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Upgrade to Pro" })).toBeVisible();
  });
});

test.describe("F12 templates", () => {
  test("F12-H1 a template becomes a deck without spending credits", async ({ page }) => {
    await signUpUi(page);
    await page.goto("/templates");
    await a11y(page);
    await page.getByRole("button", { name: "Use template" }).first().click();
    await page.waitForURL(/\/decks\//);
    await expect(page.getByRole("region", { name: /^Card \d+$/ })).toHaveCount(10);
    await expect(page.getByTestId("credits").first()).toHaveText("400");
  });
});
