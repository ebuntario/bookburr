import type { SessionStatus } from "@/lib/constants";

interface VenueSectionProps {
  status: SessionStatus;
  isHost: boolean;
  venueCount?: number;
}

export function VenueSection({
  status,
  isHost,
  venueCount = 0,
}: VenueSectionProps) {
  const showVenues = status === "discovering" || status === "voting" || status === "confirmed" || status === "completed";

  if (!showVenues) {
    // collecting phase
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground/60">Venue</h3>
        <div className="rounded-2xl border border-dashed border-foreground/20 px-5 py-6 text-center">
          {isHost ? (
            <p className="text-sm text-foreground/50">
              Abis semua orang join, lu bisa mulai cari venue 👆
            </p>
          ) : (
            <p className="text-sm text-foreground/50">
              Host lagi ngumpulin orang dulu, sabar ya 🙏
              <br />
              Venue bakal muncul abis itu
            </p>
          )}
        </div>
      </div>
    );
  }

  if (status === "discovering" && venueCount === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground/60">Venue</h3>
        <div className="flex flex-col gap-3">
          {/* Skeleton cards */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-foreground/8 animate-pulse"
            />
          ))}
          <p className="text-center text-sm text-foreground/40">
            Lagi nyari venue yang pas...
          </p>
        </div>
      </div>
    );
  }

  if (venueCount === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground/60">Venue</h3>
        <div className="rounded-2xl border border-dashed border-foreground/20 px-5 py-6 text-center">
          <p className="text-sm text-foreground/50">
            Aduh, lagi susah nyari tempat nih.
            <br />
            Lu bisa suggest langsung! 👇
          </p>
        </div>
      </div>
    );
  }

  // venues exist — will be rendered by BOO-26 (venue cards)
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-foreground/60">Venue</h3>
      <p className="text-sm text-foreground/40">
        {venueCount} venue ditemukan
      </p>
    </div>
  );
}
