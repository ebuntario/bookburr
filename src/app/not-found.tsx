import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cream px-6">
      <MagnifyingGlassIcon className="h-14 w-14 text-foreground/30" />
      <h1 className="text-2xl font-bold text-foreground">Halaman Tidak Ditemukan</h1>
      <p className="text-center text-sm text-foreground/60">
        Halaman yang kamu cari tidak tersedia.
      </p>
      <Link
        href="/home"
        className="rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-white"
      >
        Balik ke Home
      </Link>
    </div>
  );
}
