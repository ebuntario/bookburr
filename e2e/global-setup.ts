import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // Get CSRF token from NextAuth
  const csrfRes = await page.request.get("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();

  // POST directly to the credentials callback endpoint
  const callbackRes = await page.request.post(
    "/api/auth/callback/test-credentials",
    {
      form: {
        email: "e2e-user@test.bookburr.com",
        csrfToken,
      },
      maxRedirects: 0,
    }
  );

  // Verify the callback didn't redirect to an error page
  const location = callbackRes.headers()["location"] ?? "";
  expect(location).not.toContain("error");

  // Verify the session is active by checking the session endpoint
  const sessionRes = await page.request.get("/api/auth/session");
  const session = await sessionRes.json();
  expect(session?.user?.email).toBe("e2e-user@test.bookburr.com");

  // Save signed-in state
  await page.context().storageState({ path: AUTH_FILE });
});
