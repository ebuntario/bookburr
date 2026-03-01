"use client";

import { UserGroupIcon, BriefcaseIcon } from "@heroicons/react/24/outline";
import type { SessionMode } from "@/lib/constants";

const ICON_MAP: Record<SessionMode, React.ComponentType<{ className?: string }>> = {
  personal: UserGroupIcon,
  work: BriefcaseIcon,
};

interface ModeIconProps {
  mode: string;
  className?: string;
}

export function ModeIcon({ mode, className = "h-6 w-6" }: ModeIconProps) {
  const Icon = ICON_MAP[mode as SessionMode];
  if (!Icon) return <UserGroupIcon className={className} />;
  return <Icon className={className} />;
}
