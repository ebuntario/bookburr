import { VenueCard } from "./venue-card";
import { TerserahButton } from "./terserah-button";

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
  reactions: Record<string, VenueReaction>;
  voteCount: number;
  isMyVote: boolean;
}

interface VenueListProps {
  venues: Venue[];
  sessionId: string;
  status: string;
  isTerserah: boolean;
}

export function VenueList({ venues, sessionId, status, isTerserah }: VenueListProps) {
  const isVoting = status === "voting";

  return (
    <div className="flex flex-col gap-3">
      {venues.map((v, i) => (
        <VenueCard
          key={v.id}
          id={v.id}
          name={v.name}
          rating={v.rating}
          priceLevel={v.priceLevel}
          compositeScore={v.compositeScore}
          socialLinkUrl={v.socialLinkUrl}
          socialLinkPlatform={v.socialLinkPlatform}
          socialLinkMetadata={v.socialLinkMetadata}
          suggestedByMemberId={v.suggestedByMemberId}
          reactions={v.reactions}
          voteCount={v.voteCount}
          isMyVote={v.isMyVote}
          rank={i}
          sessionId={sessionId}
          status={status}
        />
      ))}

      {/* Inline suggest nudge (discovering + voting only) */}
      {(status === "discovering" || isVoting) && (
        <div className="rounded-2xl border border-dashed border-coral/30 bg-coral/5 px-4 py-4 text-center">
          <p className="text-sm text-foreground/60">
            Ada tempat yang lu mau suggest?{" "}
            <span className="font-medium text-coral">Spill aja! 🍛</span>
          </p>
        </div>
      )}

      {/* Terserah option (voting phase only) */}
      {isVoting && (
        <TerserahButton sessionId={sessionId} isTerserah={isTerserah} />
      )}
    </div>
  );
}
