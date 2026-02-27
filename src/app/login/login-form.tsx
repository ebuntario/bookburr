"use client";

import { Button, Input, Label } from "@heroui/react";
import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signIn("resend", { email, callbackUrl: callbackUrl || "/home" });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-lg font-medium">Cek email lu ya!</p>
        <p className="text-foreground/60">
          Kita udah kirim magic link ke {email}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="lu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="bg-gold font-semibold text-white"
        isDisabled={!email}
        fullWidth
      >
        Masuk pake Email
      </Button>
    </form>
  );
}
