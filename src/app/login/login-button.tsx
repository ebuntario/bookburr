"use client";

import { Button } from "@heroui/react";
import { signIn } from "next-auth/react";

export function LoginButton() {
  return (
    <Button
      color="primary"
      size="lg"
      className="bg-gold font-semibold text-white"
      onPress={() => signIn("google", { callbackUrl: "/home" })}
    >
      Masuk pake Google
    </Button>
  );
}
