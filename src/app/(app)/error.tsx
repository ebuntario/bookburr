"use client";

import { Button } from "@heroui/react";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-semibold">Yah error nih</h2>
      <p className="text-foreground/60">Something went wrong, coba lagi ya</p>
      <Button color="primary" className="bg-gold text-white" onPress={reset}>
        Coba Lagi
      </Button>
    </div>
  );
}
