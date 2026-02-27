import { SocialEmbedPreview } from "./social-embed-preview";
import type { SocialLinkMetadata } from "@/types";

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
  rank?: number; // 0-indexed
}

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="text-gold text-xs">
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

const REACTION_EMOJIS = ["🔥", "😐", "💸", "📍"] as const;

export function VenueCard({
  name,
  rating,
  priceLevel,
  socialLinkUrl,
  socialLinkPlatform,
  socialLinkMetadata,
  suggestedByMemberId,
  reactions,
  rank = 0,
}: VenueCardProps) {
  const meta = socialLinkMetadata as SocialLinkMetadata | null;
  const isBestPick = rank === 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-white px-4 py-3.5">
      {/* Header: name + best pick badge */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight text-foreground">
          {name}
        </p>
        {isBestPick && (
          <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold">
            ✨ Top Pick
          </span>
        )}
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
            <span className="text-xs text-teal font-medium">Saran anggota</span>
          </>
        )}
      </div>

      {/* Social embed preview */}
      {socialLinkUrl && socialLinkPlatform && (
        <SocialEmbedPreview
          platform={socialLinkPlatform}
          metadata={meta}
          url={socialLinkUrl}
        />
      )}

      {/* Reaction bar (read-only counts) */}
      <div className="flex items-center gap-3">
        {REACTION_EMOJIS.map((emoji) => {
          const r = reactions[emoji];
          const count = r?.count ?? 0;
          return (
            <div
              key={emoji}
              className="flex items-center gap-1 rounded-full border border-foreground/10 bg-foreground/5 px-2 py-0.5 text-xs"
            >
              <span>{emoji}</span>
              {count > 0 && (
                <span className="font-medium text-foreground/60">{count}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
