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

const providers: Provider[] = [
  Resend({
    from: process.env.AUTH_EMAIL_FROM ?? "BookBurr <noreply@bookburr.com>",
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
