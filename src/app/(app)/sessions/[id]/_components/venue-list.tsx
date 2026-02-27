import { VenueCard } from "./venue-card";

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
}

interface VenueListProps {
  venues: Venue[];
}

export function VenueList({ venues }: VenueListProps) {
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
          rank={i}
        />
      ))}

      {/* Inline suggest card */}
      <div className="rounded-2xl border border-dashed border-coral/30 bg-coral/5 px-4 py-4 text-center">
        <p className="text-sm text-foreground/60">
          Ada tempat yang lu mau suggest?{" "}
          <span className="font-medium text-coral">Spill aja! 🍛</span>
        </p>
      </div>
    </div>
  );
}
