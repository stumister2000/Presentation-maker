import { test, expect, a11y } from "./fixtures";

test("L-H1 landing page: angle, real screenshots, pricing, FAQ, accessible, no fake proof", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Presentations in a minute. The price before you start.");
  await expect(page.getByRole("img", { name: /editor/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();
  await expect(page.getByText(/trusted by|testimonial|\d+,?\d* (users|teams|customers)|★/i)).toHaveCount(0);
  await page.getByText("What happens when I run out?").click();
  await expect(page.getByText(/You keep everything/)).toBeVisible();
  await a11y(page);
  await page.getByRole("link", { name: /Start with 400 free credits/ }).click();
  await page.waitForURL("**/signup");
});

test("L-H2 privacy and terms pages render and list processors", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy policy" })).toBeVisible();
  for (const p of ["Anthropic", "Stripe", "Resend", "Unsplash", "Google"]) await expect(page.getByText(new RegExp(`^${p}`))).toBeVisible();
  await a11y(page);
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Terms of service" })).toBeVisible();
  await a11y(page);
});
