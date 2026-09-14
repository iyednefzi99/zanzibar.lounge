import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("redirects to /fr", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/fr/);
  });

  test("displays restaurant name", async ({ page }) => {
    await page.goto("/fr");
    await expect(page.locator("h1").first()).toContainText("Zanzibar");
  });

  test("has correct meta title", async ({ page }) => {
    await page.goto("/fr");
    await expect(page).toHaveTitle(/Zanzibar Lounge/);
  });

  test("has OpenGraph meta tags", async ({ page }) => {
    await page.goto("/fr");
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle).toContain("Zanzibar");
  });

  test("has structured data", async ({ page }) => {
    await page.goto("/fr");
    const scripts = page.locator('script[type="application/ld+json"]');
    await expect(scripts).toHaveCount(1);
    const content = await scripts.first().textContent();
    expect(content).toContain("Restaurant");
  });
});
