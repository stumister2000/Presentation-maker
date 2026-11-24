import { test, expect, a11y, createDeckUi } from "./fixtures";
import { signUpUi } from "./helpers";

test.describe("mobile width", () => {
  test("M-H1 create, edit and present on a phone without sideways scrolling", async ({ page }) => {
    await signUpUi(page);
    const noOverflow = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await noOverflow();
    await createDeckUi(page, "Phone deck", 3);
    await noOverflow();
    await a11y(page);
    await page.getByRole("button", { name: "Present", exact: true }).click();
    await expect(page.getByTestId("presenter")).toBeVisible();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByTestId("presenter").getByText("2 / 3")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.goto("/home");
    await noOverflow();
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    await a11y(page);
  });
});
