import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Bukber Lu</h2>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-foreground/20 py-16">
        <p className="text-foreground/60">Belum ada bukber nih, yuk bikin!</p>
        <Link
          href="/sessions/new"
          className="rounded-full bg-coral px-6 py-2.5 font-semibold text-white"
        >
          Bikin Bukber
        </Link>
      </div>
    </div>
  );
}
