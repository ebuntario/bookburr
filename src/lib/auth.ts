import NextAuth from "next-auth";
import type { Provider } from "@auth/core/providers";
import Resend from "next-auth/providers/resend";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, accounts, verificationTokens } from "./db/schema";
import { env } from "./env";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://bookburr.com";

function buildMagicLinkHtml(url: string): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
</head>
<body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 440px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="${baseUrl}/brand/icon-color.png" width="48" height="48" alt="BookBurr" style="display: block;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background: #FFFFFF; border-radius: 16px; padding: 36px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
              <!-- Heading -->
              <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #2D2D2D; line-height: 1.3;">
                Masuk ke BookBurr
              </h1>
              <p style="margin: 0 0 28px; font-size: 15px; color: #666666; line-height: 1.6;">
                Klik tombol di bawah untuk masuk. Link ini hanya berlaku sekali dan akan kedaluwarsa dalam 24 jam.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 28px;">
                <tr>
                  <td style="border-radius: 10px; background-color: #F14641;">
                    <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      Masuk sekarang
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #F0F0F0; margin: 0 0 20px;" />

              <!-- Fallback URL -->
              <p style="margin: 0 0 4px; font-size: 12px; color: #999999; line-height: 1.5;">
                Tombol tidak berfungsi? Salin link berikut ke browser:
              </p>
              <p style="margin: 0; font-size: 12px; color: #F14641; line-height: 1.5; word-break: break-all;">
                ${url}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="margin: 0; font-size: 12px; color: #999999; line-height: 1.5;">
                Tidak merasa meminta email ini? Abaikan saja.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #CCCCCC;">
                &copy; BookBurr &middot; Koordinasi bukber anti ribet
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

const providers: Provider[] = [
  Resend({
    from: env.AUTH_EMAIL_FROM,
    async sendVerificationRequest({ identifier: email, url, provider }) {
      const { Resend: ResendClient } = await import("resend");
      const resend = new ResendClient(env.AUTH_RESEND_KEY);

      const { error } = await resend.emails.send({
        from: provider.from as string,
        to: email,
        subject: "Masuk ke BookBurr",
        html: buildMagicLinkHtml(url),
      });

      if (error) throw new Error(`Resend error: ${error.message}`);
    },
  }),
];

// Google OAuth — only enabled when credentials are configured
if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    })
  );
}

// Test-only credentials provider — gated behind E2E_TEST env var.
// Only accepts @test.bookburr.com emails. Never ships to production.
if (process.env.E2E_TEST === "true") {
  providers.push(
    Credentials({
      id: "test-credentials",
      name: "Test Credentials",
      credentials: { email: { label: "Email", type: "email" } },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        if (!email?.endsWith("@test.bookburr.com")) return null;

        // Find or create the test user (JWT strategy doesn't auto-create)
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existing.length > 0) return existing[0];

        const { nanoid } = await import("nanoid");
        const id = nanoid();
        const [created] = await db
          .insert(users)
          .values({ id, email, name: "E2E Test User" })
          .returning();
        return created;
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/login",
  },
});
