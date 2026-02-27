interface ProfileStatsProps {
  totalSessions: number;
  sessionsHosted: number;
}

export function ProfileStats({ totalSessions, sessionsHosted }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1 rounded-2xl bg-gold/10 px-4 py-4">
        <p className="text-2xl font-bold text-gold">{totalSessions}</p>
        <p className="text-xs text-foreground/60">bukber total</p>
      </div>
      <div className="flex flex-col gap-1 rounded-2xl bg-green/10 px-4 py-4">
        <p className="text-2xl font-bold text-green">{sessionsHosted}</p>
        <p className="text-xs text-foreground/60">bukber lu yang host</p>
      </div>
    </div>
  );
}
