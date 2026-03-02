import { SparklesIcon } from "@heroicons/react/24/solid";
import { SocialEmbedPreview } from "./social-embed-preview";
import { EmojiReactionBar } from "./emoji-reaction-bar";
import { VenueVoteButton } from "./venue-vote-button";
import type { SocialLinkMetadata } from "@/types";
import { SESSION_STATUS } from "@/lib/constants";

interface VenueReaction {
  count: number;
  hasMyReaction: boolean;
}

interface VenueCardProps {
  id: string;
  name: string;
  rating: number | null;
  priceLevel: number | null;
  compositeScore: number;
  socialLinkUrl: string | null;
  socialLinkPlatform: string | null;
  socialLinkMetadata: unknown;
  suggestedByMemberId: string | null;
  reactions: Record<string, VenueReaction>;
  voteCount: number;
  isMyVote: boolean;
  rank?: number; // 0-indexed
  sessionId: string;
  status: string; // session status
}

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="text-primary text-xs">
      {"★".repeat(full)}
      {half ? "½" : ""}
      {"☆".repeat(Math.max(0, 5 - full - (half ? 1 : 0)))}
    </span>
  );
}

function PriceLevel({ level }: { level: number }) {
  return (
    <span className="text-xs text-foreground/50">
      {"$".repeat(level)}
      <span className="text-foreground/20">{"$".repeat(Math.max(0, 4 - level))}</span>
    </span>
  );
}

export function VenueCard({
  id,
  name,
  rating,
  priceLevel,
  socialLinkUrl,
  socialLinkPlatform,
  socialLinkMetadata,
  suggestedByMemberId,
  reactions,
  voteCount,
  isMyVote,
  rank = 0,
  sessionId,
  status,
}: VenueCardProps) {
  const meta = socialLinkMetadata as SocialLinkMetadata | null;
  const isBestPick = rank === 0;
  const isVotingPhase = status === SESSION_STATUS.voting;
  const canReact = status === SESSION_STATUS.discovering || status === SESSION_STATUS.voting;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-white px-4 py-3.5">
      {/* Header: name + best pick badge + vote button */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-heading font-medium leading-tight text-foreground">
          {name}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {isBestPick && (
            <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              <SparklesIcon className="h-3 w-3" /> Top Pick
            </span>
          )}
          {isVotingPhase && (
            <VenueVoteButton
              sessionId={sessionId}
              venueId={id}
              voteCount={voteCount}
              isMyVote={isMyVote}
            />
          )}
        </div>
      </div>

      {/* Rating + price + suggested badge */}
      <div className="flex items-center gap-2">
        {rating != null && (
          <>
            <RatingStars rating={rating} />
            <span className="text-xs text-foreground/50">{rating.toFixed(1)}</span>
          </>
        )}
        {priceLevel != null && priceLevel > 0 && (
          <>
            {rating != null && <span className="text-foreground/20">·</span>}
            <PriceLevel level={priceLevel} />
          </>
        )}
        {suggestedByMemberId && (
          <>
            <span className="text-foreground/20">·</span>
            <span className="text-xs font-medium text-teal">Saran anggota</span>
          </>
        )}
      </div>

      {/* Social embed preview */}
      {socialLinkUrl && socialLinkPlatform && (
        <SocialEmbedPreview
          platform={socialLinkPlatform}
          metadata={meta}
          url={socialLinkUrl}
          venueId={id}
          sessionId={sessionId}
        />
      )}

      {/* Emoji reaction bar */}
      <EmojiReactionBar
        sessionId={sessionId}
        venueId={id}
        reactions={reactions}
        canReact={canReact}
      />
    </div>
  );
}
