"use client";

import { motion } from "framer-motion";
import { fadeUp, springs } from "@/lib/motion-variants";

export function VenueRevealItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      {...fadeUp}
      whileInView={fadeUp.animate}
      viewport={{ once: true, amount: 0.3 }}
      transition={springs.smooth}
    >
      {children}
    </motion.div>
  );
}
