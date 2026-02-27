"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface CelebrationOverlayProps {
  venueName: string;
  dateStr: string;
  onClose: () => void;
}

const CONFETTI_EMOJIS = ["🎉", "🎊", "✨", "🌟", "🥳", "🎈", "🪅"];

export function CelebrationOverlay({
  venueName,
  dateStr,
  onClose,
}: CelebrationOverlayProps) {
  const [confetti] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
      left: `${5 + (i * 5) % 90}%`,
      delay: i * 0.08,
      duration: 1.8 + (i % 4) * 0.5,
    })),
  );

  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const whatsappText = encodeURIComponent(
    `Bukber kita jadi nih! Di ${venueName}${dateStr ? `, ${dateStr}` : ""}. See you! 🎉`,
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-foreground/70 px-5"
      onClick={onClose}
    >
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((c) => (
          <motion.span
            key={c.id}
            className="absolute top-0 text-2xl"
            style={{ left: c.left }}
            initial={{ y: -60, opacity: 1 }}
            animate={{ y: "110vh", opacity: 0 }}
            transition={{
              duration: c.duration,
              delay: c.delay,
              ease: "easeIn",
            }}
          >
            {c.emoji}
          </motion.span>
        ))}
      </div>

      {/* Card */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.4, delay: 0.15 }}
        className="relative z-10 w-full max-w-sm rounded-2xl bg-[#FFF8F0] p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-3 text-4xl">🎉</p>
        <h2 className="text-xl font-bold text-foreground">Kita sepakat!</h2>
        <p className="mt-2 text-sm text-foreground/70">
          Bukber di{" "}
          <strong className="text-gold">{venueName}</strong>
          {dateStr && (
            <>
              ,{" "}
              <strong className="text-teal">{dateStr}</strong>
            </>
          )}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-green py-3 text-sm font-semibold text-white"
            onClick={(e) => e.stopPropagation()}
          >
            💬 Share ke WhatsApp
          </a>
          <button
            type="button"
            onClick={onClose}
            className="py-2 text-sm text-foreground/50"
          >
            Lihat detail bukber
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
