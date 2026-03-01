"use client";

import { motion } from "framer-motion";
import { springs } from "@/lib/motion-variants";

const MAX_AVATARS = 6;

const AVATAR_COLORS = [
  "bg-gold",
  "bg-teal",
  "bg-coral",
  "bg-green",
] as const;

function getAvatarColor(userId: string): string {
  const sum = userId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

interface Member {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface SessionProgressProps {
  completedCount: number;
  totalCount: number;
  members: Member[];
  completedMemberIds: Set<string>;
  status: string;
}

const RING_COLORS: Record<string, string> = {
  collecting: "var(--color-gold)",
  discovering: "var(--color-gold)",
  voting: "var(--color-teal)",
  confirmed: "var(--color-green)",
  completed: "var(--color-green)",
};

const RADIUS = 48;
const STROKE = 6;
const SIZE = (RADIUS + STROKE) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function SessionProgress({
  completedCount,
  totalCount,
  members,
  completedMemberIds,
  status,
}: SessionProgressProps) {
  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const ringColor = RING_COLORS[status] ?? RING_COLORS.collecting;

  // Place up to MAX_AVATARS around the ring
  const visible = members.slice(0, MAX_AVATARS);
  const avatarRadius = RADIUS + STROKE + 14;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: SIZE + 28, height: SIZE + 28 }}>
        {/* SVG ring */}
        <svg
          width={SIZE + 28}
          height={SIZE + 28}
          className="absolute inset-0"
        >
          {/* Background track */}
          <circle
            cx={(SIZE + 28) / 2}
            cy={(SIZE + 28) / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-foreground/10"
          />
          {/* Progress arc */}
          <motion.circle
            cx={(SIZE + 28) / 2}
            cy={(SIZE + 28) / 2}
            r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - progress) }}
            transition={springs.smooth}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* Avatar circles around the ring */}
        {visible.map((member, i) => {
          const angle = (2 * Math.PI * i) / visible.length - Math.PI / 2;
          const cx = (SIZE + 28) / 2 + avatarRadius * Math.cos(angle) - 14;
          const cy = (SIZE + 28) / 2 + avatarRadius * Math.sin(angle) - 14;
          const isCompleted = completedMemberIds.has(member.id);
          const displayName = member.name ?? member.email.split("@")[0];
          const initial = displayName[0]?.toUpperCase() ?? "?";
          const color = getAvatarColor(member.userId);

          return (
            <div
              key={member.id}
              className="absolute"
              style={{ left: cx, top: cy }}
            >
              <div
                className={`relative h-7 w-7 rounded-full border-2 border-cream flex items-center justify-center ${!isCompleted ? "animate-gentle-pulse" : ""}`}
              >
                {member.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.image}
                    alt={displayName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`h-full w-full rounded-full flex items-center justify-center ${color}`}
                  >
                    <span className="text-[10px] font-bold text-white">
                      {initial}
                    </span>
                  </div>
                )}
                {isCompleted && (
                  <div className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-green flex items-center justify-center border border-cream">
                    <span className="text-[7px] text-white">&#10003;</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-foreground/50">
        {completedCount === totalCount
          ? "Semua udah siap!"
          : `${completedCount} dari ${totalCount} orang udah siap`}
      </p>
    </div>
  );
}
