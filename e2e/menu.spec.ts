import { test, expect } from "@playwright/test";

test.describe("Menu page", () => {
  test("loads and shows menu items", async ({ page }) => {
    await page.goto("/fr/carte");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("has correct meta title", async ({ page }) => {
    await page.goto("/fr/carte");
    await expect(page).toHaveTitle(/carte/i);
  });

  test("is available in Arabic", async ({ page }) => {
    await page.goto("/ar/carte");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("is available in English", async ({ page }) => {
    await page.goto("/en/carte");
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Menu API", () => {
  test("returns menu items", async ({ request }) => {
    const response = await request.get("/api/menu");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.items).toBeDefined();
    expect(Array.isArray(data.items)).toBeTruthy();
  });
});
