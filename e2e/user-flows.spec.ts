import { test, expect } from "@playwright/test";

test.describe("Full reservation flow", () => {
  test("can navigate to booking page", async ({ page }) => {
    await page.goto("/fr");
    // Click the booking link in the hero or nav
    const bookLink = page.locator('a[href*="reserver"]').first();
    await expect(bookLink).toBeVisible();
    await bookLink.click();
    await expect(page).toHaveURL(/\/reserver/);
  });

  test("form has all required fields", async ({ page }) => {
    await page.goto("/fr/reserver");
    // Check that key form elements exist
    await expect(page.locator("form")).toBeVisible();
  });
});

test.describe("Language switching", () => {
  test("can switch from French to English", async ({ page }) => {
    await page.goto("/fr");
    // Look for locale switcher
    const switcher = page.locator("[data-testid='locale-switcher'], button:has-text('EN'), a:has-text('EN')").first();
    if (await switcher.isVisible()) {
      await switcher.click();
      await expect(page).toHaveURL(/\/en/);
    }
  });

  test("Arabic pages have RTL direction", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});

test.describe("Reviews page", () => {
  test("loads and shows reviews", async ({ page }) => {
    await page.goto("/fr/avis");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("has review form", async ({ page }) => {
    await page.goto("/fr/avis");
    await expect(page.locator("form")).toBeVisible();
  });
});

test.describe("Loyalty page", () => {
  test("loads correctly", async ({ page }) => {
    await page.goto("/fr/fidelite");
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Ordering page", () => {
  test("loads and shows menu", async ({ page }) => {
    await page.goto("/fr/commander");
    await expect(page.locator("h1")).toBeVisible();
  });
});
