import { test, expect } from "@playwright/test";

test.describe("Admin page", () => {
  test("requires authentication", async ({ request }) => {
    const response = await request.get("/fr/admin");
    expect(response.status()).toBe(401);
  });

  test("loads with valid credentials", async ({ page }) => {
    // Set Basic Auth header
    await page.setExtraHTTPHeaders({
      Authorization: "Basic " + btoa("salle:salle"),
    });
    const response = await page.goto("/fr/admin");
    // Should not be 401
    expect(response?.status()).not.toBe(401);
  });
});

test.describe("Admin Orders page", () => {
  test("requires authentication", async ({ request }) => {
    const response = await request.get("/fr/admin/orders");
    expect(response.status()).toBe(401);
  });
});

test.describe("Admin Reviews page", () => {
  test("requires authentication", async ({ request }) => {
    const response = await request.get("/fr/admin/reviews");
    expect(response.status()).toBe(401);
  });
});

test.describe("Admin Chat page", () => {
  test("requires authentication", async ({ request }) => {
    const response = await request.get("/fr/admin/chat");
    expect(response.status()).toBe(401);
  });
});

test.describe("Admin Analytics page", () => {
  test("requires authentication", async ({ request }) => {
    const response = await request.get("/fr/admin/analytics");
    expect(response.status()).toBe(401);
  });
});
