import { describe, it, expect, afterEach } from "vitest";

// env.ts uses getters that read process.env at access time,
// so we can manipulate process.env directly before each test.

describe("env", () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    // Restore env vars after each test
    Object.keys(process.env).forEach((k) => {
      if (!(k in ORIGINAL_ENV)) {
        delete process.env[k];
      }
    });
    Object.assign(process.env, ORIGINAL_ENV);
  });

  describe("required vars", () => {
    it("throws when DATABASE_URL is missing", async () => {
      delete process.env.DATABASE_URL;
      const { env } = await import("./env");
      expect(() => env.DATABASE_URL).toThrow("Missing required env var: DATABASE_URL");
    });

    it("returns value when DATABASE_URL is present", async () => {
      process.env.DATABASE_URL = "postgres://test";
      const { env } = await import("./env");
      expect(env.DATABASE_URL).toBe("postgres://test");
    });

    it("throws when AUTH_SECRET is missing", async () => {
      delete process.env.AUTH_SECRET;
      const { env } = await import("./env");
      expect(() => env.AUTH_SECRET).toThrow("Missing required env var: AUTH_SECRET");
    });

    it("returns value when AUTH_SECRET is present", async () => {
      process.env.AUTH_SECRET = "supersecret";
      const { env } = await import("./env");
      expect(env.AUTH_SECRET).toBe("supersecret");
    });

    it("throws when AUTH_RESEND_KEY is missing", async () => {
      delete process.env.AUTH_RESEND_KEY;
      const { env } = await import("./env");
      expect(() => env.AUTH_RESEND_KEY).toThrow("Missing required env var: AUTH_RESEND_KEY");
    });

    it("returns value when AUTH_RESEND_KEY is present", async () => {
      process.env.AUTH_RESEND_KEY = "re_test_key";
      const { env } = await import("./env");
      expect(env.AUTH_RESEND_KEY).toBe("re_test_key");
    });
  });

  describe("optional vars", () => {
    it("AUTH_EMAIL_FROM returns default when unset", async () => {
      delete process.env.AUTH_EMAIL_FROM;
      const { env } = await import("./env");
      expect(env.AUTH_EMAIL_FROM).toBe("BookBurr <noreply@bookburr.com>");
    });

    it("AUTH_EMAIL_FROM returns value when set", async () => {
      process.env.AUTH_EMAIL_FROM = "Test <test@example.com>";
      const { env } = await import("./env");
      expect(env.AUTH_EMAIL_FROM).toBe("Test <test@example.com>");
    });

    it("GOOGLE_PLACES_API_KEY returns null when unset", async () => {
      delete process.env.GOOGLE_PLACES_API_KEY;
      const { env } = await import("./env");
      expect(env.GOOGLE_PLACES_API_KEY).toBeNull();
    });

    it("GOOGLE_PLACES_API_KEY returns value when set", async () => {
      process.env.GOOGLE_PLACES_API_KEY = "AIza_test";
      const { env } = await import("./env");
      expect(env.GOOGLE_PLACES_API_KEY).toBe("AIza_test");
    });

    it("NEXT_PUBLIC_SUPABASE_URL returns null when unset", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      const { env } = await import("./env");
      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeNull();
    });

    it("NEXT_PUBLIC_SUPABASE_ANON_KEY returns null when unset", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const { env } = await import("./env");
      expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeNull();
    });

    it("SUPABASE_SERVICE_ROLE_KEY returns null when unset", async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      const { env } = await import("./env");
      expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeNull();
    });
  });
});
