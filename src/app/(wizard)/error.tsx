"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function WizardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cream px-6">
      <ExclamationTriangleIcon className="h-12 w-12 text-foreground/30" />
      <h1 className="text-xl font-bold text-foreground">Terjadi Kesalahan</h1>
      <p className="text-center text-sm text-foreground/60">
        Langkah ini gagal. Silakan coba lagi atau kembali ke beranda.
      </p>
      <div className="flex gap-3">
        <Button className="bg-gold text-white font-semibold" onPress={reset}>
          Coba Lagi
        </Button>
        <Link
          href="/home"
          className="flex items-center rounded-xl border border-foreground/20 px-4 py-2 text-sm font-medium text-foreground"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
