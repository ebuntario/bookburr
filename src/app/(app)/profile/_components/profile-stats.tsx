"use client";

import { motion } from "framer-motion";

interface ProfileStatsProps {
  totalSessions: number;
  sessionsHosted: number;
}

export function ProfileStats({ totalSessions, sessionsHosted }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1 rounded-2xl bg-gold/10 px-4 py-4"
      >
        <p className="text-2xl font-bold text-gold">{totalSessions}</p>
        <p className="text-xs text-foreground/60">bukber total</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col gap-1 rounded-2xl bg-green/10 px-4 py-4"
      >
        <p className="text-2xl font-bold text-green">{sessionsHosted}</p>
        <p className="text-xs text-foreground/60">bukber lu yang host</p>
      </motion.div>
    </div>
  );
}
