"use client";

import { motion } from "framer-motion";

interface Member {
  id: string;
  name: string | null;
  email: string;
}

interface WaitingOnListProps {
  pendingMembers: Member[];
  status: string;
}

function getDisplayName(name: string | null, email: string): string {
  return name ?? email.split("@")[0];
}

export function WaitingOnList({ pendingMembers, status }: WaitingOnListProps) {
  if (pendingMembers.length === 0) return null;

  // During voting, don't reveal names (anonymous voting)
  if (status === "voting") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3"
      >
        <p className="text-sm text-foreground/60">
          {pendingMembers.length} orang belum vote
        </p>
      </motion.div>
    );
  }

  // Only show during collecting/discovering
  if (status !== "collecting" && status !== "discovering") return null;

  const names = pendingMembers.map((m) => getDisplayName(m.name, m.email));
  let text: string;

  if (names.length === 1) {
    text = `Tinggal ${names[0]} nih`;
  } else if (names.length === 2) {
    text = `Tinggal ${names[0]} sama ${names[1]} nih`;
  } else {
    const remaining = names.length - 2;
    text = `Tinggal ${names[0]}, ${names[1]}, sama ${remaining} orang lagi nih`;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3"
    >
      <p className="text-sm text-foreground/70">{text}</p>
    </motion.div>
  );
}
