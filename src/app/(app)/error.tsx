"use client";

import { Button } from "@heroui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <ExclamationTriangleIcon className="h-10 w-10 text-foreground/30" />
      <h2 className="text-2xl font-semibold">Terjadi Kesalahan</h2>
      <p className="text-foreground/60">Terjadi kesalahan. Silakan coba lagi.</p>
      <Button className="bg-gold text-white" onPress={reset}>
        Coba Lagi
      </Button>
    </div>
  );
}
