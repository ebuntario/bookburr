import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("loads and shows session list heading", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByRole("heading", { name: "List Bukber" })).toBeVisible();
  });

  test("shows empty state or session cards", async ({ page }) => {
    await page.goto("/home");

    // Either the empty state message or at least one session card should be visible
    const emptyState = page.getByText("Belum ada bukber nih").first();
    const sessionCard = page.locator("[data-slot='card']").first();

    await expect(emptyState.or(sessionCard)).toBeVisible();
  });

  test("'Bikin' link navigates to session creation", async ({ page }) => {
    await page.goto("/home");

    // Click the "Bikin Bukber" or "+ Bikin" button/link
    const bikinLink = page.getByRole("link", { name: /bikin/i });
    await expect(bikinLink.first()).toBeVisible();
    await bikinLink.first().click();

    await expect(page).toHaveURL(/\/sessions\/new/);
  });
});
