"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion-variants";

interface ProfileStatsProps {
  totalSessions: number;
  sessionsHosted: number;
}

export function ProfileStats({ totalSessions, sessionsHosted }: ProfileStatsProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3"
    >
      <motion.div
        variants={staggerItem}
        className="flex flex-col gap-1 rounded-2xl bg-primary/10 px-4 py-4"
      >
        <p className="text-2xl font-heading font-semibold text-primary">{totalSessions}</p>
        <p className="text-xs text-foreground/60">bukber total</p>
      </motion.div>
      <motion.div
        variants={staggerItem}
        className="flex flex-col gap-1 rounded-2xl bg-success/10 px-4 py-4"
      >
        <p className="text-2xl font-heading font-semibold text-success">{sessionsHosted}</p>
        <p className="text-xs text-foreground/60">bukber lu yang host</p>
      </motion.div>
    </motion.div>
  );
}
