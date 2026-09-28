import { test, expect } from "@playwright/test";

test.describe("Staff page", () => {
  test("requires authentication", async ({ request }) => {
    const response = await request.get("/fr/staff");
    expect(response.status()).toBe(401);
  });

  test("redirects to login without a session", async ({ page }) => {
    const user = process.env.ADMIN_USER;
    const password = process.env.ADMIN_PASSWORD;
    test.skip(!user || !password, "ADMIN_USER / ADMIN_PASSWORD not configured");

    await page.setExtraHTTPHeaders({
      Authorization: "Basic " + btoa(`${user}:${password}`),
    });
    await page.goto("/fr/staff");
    await expect(page).toHaveURL(/\/fr\/staff\/login/);
  });

  test("signs in with seeded credentials", async ({ page }) => {
    const user = process.env.ADMIN_USER;
    const password = process.env.ADMIN_PASSWORD;
    test.skip(!user || !password, "ADMIN_USER / ADMIN_PASSWORD not configured");

    await page.setExtraHTTPHeaders({
      Authorization: "Basic " + btoa(`${user}:${password}`),
    });
    await page.goto("/fr/staff/login");
    await page
      .getByLabel("Email")
      .fill(process.env.STAFF_SEED_EMAIL ?? "staff@e-coffee.local");
    await page
      .getByLabel("Mot de passe")
      .fill(process.env.STAFF_SEED_PASSWORD ?? "staff-demo-2026");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page).toHaveURL(/\/fr\/staff$/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("signs out and returns to login", async ({ page }) => {
    const user = process.env.ADMIN_USER;
    const password = process.env.ADMIN_PASSWORD;
    test.skip(!user || !password, "ADMIN_USER / ADMIN_PASSWORD not configured");

    await page.setExtraHTTPHeaders({
      Authorization: "Basic " + btoa(`${user}:${password}`),
    });
    await page.goto("/fr/staff/login");
    await page
      .getByLabel("Email")
      .fill(process.env.STAFF_SEED_EMAIL ?? "staff@e-coffee.local");
    await page
      .getByLabel("Mot de passe")
      .fill(process.env.STAFF_SEED_PASSWORD ?? "staff-demo-2026");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/fr\/staff$/);

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/fr\/staff\/login/);

    // La session est bien détruite : le dashboard redirige de nouveau.
    await page.goto("/fr/staff");
    await expect(page).toHaveURL(/\/fr\/staff\/login/);
  });
});
