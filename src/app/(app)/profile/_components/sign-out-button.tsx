"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full rounded-xl border border-foreground/15 py-3 text-sm font-semibold text-foreground/50 transition-colors active:bg-foreground/5"
    >
      Keluar
    </button>
  );
}
