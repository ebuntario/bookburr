"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function TestLoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [email, setEmail] = useState("e2e-user@test.bookburr.com");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signIn("test-credentials", {
      email,
      callbackUrl: callbackUrl || "/home",
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-3 border-t border-foreground/10 pt-6"
      data-testid="test-login-form"
    >
      <p className="text-center text-xs font-medium text-foreground/40">
        Test Login (E2E only)
      </p>
      <input
        type="email"
        name="email"
        aria-label="Test email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-lg border border-foreground/15 px-3 py-2 text-sm"
        required
      />
      <button
        type="submit"
        className="rounded-lg bg-foreground/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/20"
      >
        Test Sign In
      </button>
    </form>
  );
}
