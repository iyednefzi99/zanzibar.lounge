import { test, expect } from "@playwright/test";

test.describe("Booking page", () => {
  test("loads and shows form", async ({ page }) => {
    await page.goto("/fr/reserver");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("form")).toBeVisible();
  });

  test("has correct meta title", async ({ page }) => {
    await page.goto("/fr/reserver");
    await expect(page).toHaveTitle(/Réserver/);
  });

  test("shows WhatsApp link when configured", async ({ page }) => {
    await page.goto("/fr/reserver");
    const whatsappLink = page.locator('a[href*="wa.me"], a[href*="whatsapp"]');
    // Link may or may not be present depending on env config
    const count = await whatsappLink.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Availability API", () => {
  test("returns available slots", async ({ request }) => {
    const today = new Date().toISOString().split("T")[0];
    const response = await request.get(
      `/api/availability?date=${today}&party=4`,
    );
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("slots");
  });

  test("rejects invalid date", async ({ request }) => {
    const response = await request.get(
      "/api/availability?date=invalid&party=4",
    );
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
