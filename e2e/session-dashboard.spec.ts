import { test, expect } from "@playwright/test";

let sessionUrl: string;

test.describe("Session dashboard", () => {
  test.beforeAll(async ({ browser }) => {
    // Create a session via the wizard to get a real session URL
    const context = await browser.newContext({
      storageState: "e2e/.auth/user.json",
    });
    const page = await context.newPage();

    await page.goto("/sessions/new");

    // Step 1: name
    await page.getByRole("textbox", { name: /nama bukber/i }).fill("Dashboard Test");
    await page.getByRole("button", { name: "Lanjut" }).click();

    // Step 2: mode
    await page.getByText("Personal").click();
    await page.getByRole("button", { name: "Lanjut" }).click();

    // Step 3: date not fixed
    await page.getByRole("button", { name: /^Belum/ }).click();
    await page.getByRole("button", { name: "Lanjut" }).click();

    // Step 4: venue not fixed
    await page.getByRole("button", { name: /^Belum/ }).click();
    await page.getByRole("button", { name: "Lanjut" }).click();

    // Step 5: skip date seeding
    await page.getByRole("button", { name: /skip/i }).click();

    // Wait for success page
    await page.waitForURL(/\/sessions\/[^/]+\/success/, { timeout: 10_000 });

    // Extract the session ID from the success URL and build the dashboard URL
    const url = new URL(page.url());
    const sessionId = url.pathname.split("/sessions/")[1].split("/")[0];
    sessionUrl = `/sessions/${sessionId}`;

    await context.close();
  });

  test("loads dashboard with session header", async ({ page }) => {
    await page.goto(sessionUrl, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByText("Dashboard Test")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows session status", async ({ page }) => {
    await page.goto(sessionUrl, { waitUntil: "domcontentloaded" });
    // The session should be in "collecting" status after creation
    await expect(
      page.getByText("Lagi Ngumpulin", { exact: true })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("invite button is visible", async ({ page }) => {
    await page.goto(sessionUrl, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("button", { name: "Invite Temen" })
    ).toBeVisible({ timeout: 10_000 });
  });
});
