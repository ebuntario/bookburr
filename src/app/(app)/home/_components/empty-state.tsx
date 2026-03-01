"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MoonIcon } from "@heroicons/react/24/outline";

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
      className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-foreground/20 py-16"
    >
      <MoonIcon className="h-10 w-10 text-gold" />
      <p className="text-foreground/60">Belum ada bukber nih, yuk bikin!</p>
      <Link
        href="/sessions/new"
        className="rounded-full bg-coral px-6 py-2.5 font-semibold text-white"
      >
        Bikin Bukber
      </Link>
    </motion.div>
  );
}
