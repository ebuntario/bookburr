import { test, expect } from "@playwright/test";

test.describe("Session creation wizard", () => {
  test("full wizard: Personal, no fixed date, no fixed venue", async ({
    page,
  }) => {
    await page.goto("/sessions/new");

    // Step 1: Session name
    await expect(
      page.getByText("Mau bikin bukber apa nih?")
    ).toBeVisible();
    await page.getByRole("textbox", { name: /nama bukber/i }).fill("E2E Test Bukber");
    await page.getByRole("button", { name: "Lanjut" }).click();

    // Step 2: Session mode — pick "Personal"
    await expect(page.getByText("Tipe bukber-nya apa?")).toBeVisible();
    await page.getByText("Personal").click();
    await page.getByRole("button", { name: "Lanjut" }).click();

    // Step 3: Date fixed? — pick "Belum"
    await expect(page.getByText("Tanggalnya udah fix?")).toBeVisible();
    await page.getByRole("button", { name: /^Belum/ }).click();
    await page.getByRole("button", { name: "Lanjut" }).click();

    // Step 4: Venue fixed? — pick "Belum"
    await expect(
      page.getByText("Tempatnya udah ada pilihan?")
    ).toBeVisible();
    await page.getByRole("button", { name: /^Belum/ }).click();
    await page.getByRole("button", { name: "Lanjut" }).click();

    // Step 5: Date seeding — skip
    await expect(page.getByText("Mau kasih clue tanggal?")).toBeVisible();
    await page
      .getByRole("button", { name: /skip/i })
      .click();

    // Should redirect to success page
    await expect(page).toHaveURL(/\/sessions\/[^/]+\/success/, {
      timeout: 10_000,
    });
  });
});
