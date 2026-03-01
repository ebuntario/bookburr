import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-heading font-semibold text-primary">Cek email kamu</h1>
      <p className="max-w-sm text-foreground/60">
        Link login sudah dikirim ke email kamu. Klik link di email untuk masuk ke BookBurr.
      </p>
      <Link
        href="/login"
        className="text-sm text-foreground/50 underline underline-offset-4 transition-colors active:text-foreground/70"
      >
        Salah email? Coba lagi
      </Link>
    </main>
  );
}
