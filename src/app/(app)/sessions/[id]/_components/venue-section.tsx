import type { SessionStatus } from "@/lib/constants";
import { SESSION_STATUS } from "@/lib/constants";
import { VenueList } from "./venue-list";
import { SuggestVenueFab } from "./suggest-venue-fab";

interface VenueReaction {
  count: number;
  hasMyReaction: boolean;
}

interface Venue {
  id: string;
  name: string;
  rating: number | null;
  priceLevel: number | null;
  compositeScore: number;
  location: unknown;
  socialLinkUrl: string | null;
  socialLinkPlatform: string | null;
  socialLinkMetadata: unknown;
  suggestedByMemberId: string | null;
  aiInsight: unknown;
  reactions: Record<string, VenueReaction>;
  voteCount: number;
  isMyVote: boolean;
}

interface VenueSectionProps {
  sessionId: string;
  status: SessionStatus;
  isHost: boolean;
  venues: Venue[];
  isTerserah: boolean;
}

export function VenueSection({
  sessionId,
  status,
  isHost,
  venues,
  isTerserah,
}: VenueSectionProps) {
  const showVenues =
    status === SESSION_STATUS.discovering ||
    status === SESSION_STATUS.voting ||
    status === SESSION_STATUS.confirmed ||
    status === SESSION_STATUS.completed;

  const canSuggest = status === SESSION_STATUS.discovering || status === SESSION_STATUS.voting;

  if (!showVenues) {
    // Collecting phase
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-heading font-semibold text-foreground/70">Tempat</h3>
        <div className="rounded-2xl border border-dashed border-foreground/20 px-5 py-6 text-center">
          {isHost ? (
            <p className="text-sm text-foreground/50">
              Abis semua orang join, lu bisa mulai cari venue
            </p>
          ) : (
            <p className="text-sm text-foreground/50">
              Tempat bakal muncul abis host mulai cari
            </p>
          )}
        </div>
      </div>
    );
  }

  if (status === SESSION_STATUS.discovering && venues.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-heading font-semibold text-foreground/70">Tempat</h3>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl bg-foreground/8"
            />
          ))}
          <p className="text-center text-sm text-foreground/40">
            Lagi nyari venue yang pas...
          </p>
        </div>
        {canSuggest && <SuggestVenueFab sessionId={sessionId} />}
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-heading font-semibold text-foreground/70">Tempat</h3>
        <div className="rounded-2xl border border-dashed border-foreground/20 px-5 py-6 text-center">
          <p className="text-sm text-foreground/50">
            Aduh, lagi susah nyari tempat nih.
            <br />
            Lu bisa suggest langsung!
          </p>
        </div>
        {canSuggest && <SuggestVenueFab sessionId={sessionId} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-heading font-semibold text-foreground/70">Tempat</h3>
        <p className="text-xs text-foreground/40">{venues.length} tempat</p>
      </div>

      <VenueList
        venues={venues}
        sessionId={sessionId}
        status={status}
        isTerserah={isTerserah}
      />

      {canSuggest && <SuggestVenueFab sessionId={sessionId} />}
    </div>
  );
}
