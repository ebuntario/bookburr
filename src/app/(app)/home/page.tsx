import { Button } from "@heroui/react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Bukber Lu</h2>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-foreground/20 py-16">
        <p className="text-foreground/60">Belum ada bukber nih, yuk bikin!</p>
        <Button
          as={Link}
          href="/sessions/new"
          color="primary"
          className="bg-coral font-semibold text-white"
        >
          Bikin Bukber
        </Button>
      </div>
    </div>
  );
}
