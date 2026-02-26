import Link from "next/link";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-foreground/20 py-16">
      <span className="text-4xl">🌙</span>
      <p className="text-foreground/60">Belum ada bukber nih, yuk bikin!</p>
      <Link
        href="/sessions/new"
        className="rounded-full bg-coral px-6 py-2.5 font-semibold text-white"
      >
        Bikin Bukber
      </Link>
    </div>
  );
}
