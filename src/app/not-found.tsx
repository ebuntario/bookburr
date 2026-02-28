import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cream px-6">
      <p className="text-6xl">🫠</p>
      <h1 className="text-2xl font-bold text-foreground">404 — Halaman ga ketemu</h1>
      <p className="text-center text-sm text-foreground/60">
        Kayaknya halamannya udah pindah atau emang ga ada deh.
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
