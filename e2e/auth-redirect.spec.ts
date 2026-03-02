import { test, expect } from "@playwright/test";

test.describe("Auth redirects", () => {
  test("unauthenticated visit to /home redirects to /login with callbackUrl", async ({
    browser,
  }) => {
    // Use a fresh context with NO storageState to simulate unauthenticated user
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto("/home");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fhome/);

    await context.close();
  });

  test("authenticated visit to / redirects to /home", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/home/);
  });
});
