"use client";

import { useState, useTransition } from "react";
import { refreshVenueMetadata } from "@/lib/actions/social-metadata";

interface SocialEmbedPreviewProps {
  platform: string;
  metadata: {
    title?: string;
    thumbnail_url?: string;
    author_name?: string;
  } | null;
  url: string;
  venueId?: string;
  sessionId?: string;
}

export function SocialEmbedPreview({
  platform,
  metadata,
  url,
  venueId,
  sessionId,
}: SocialEmbedPreviewProps) {
  const isTikTok = platform === "tiktok";
  const isInstagram = platform === "instagram";
  const [isPending, startTransition] = useTransition();
  const [attempts, setAttempts] = useState(0);

  const borderClass = isTikTok
    ? "border-l-4 border-black"
    : isInstagram
      ? "border-l-4 border-pink-500"
      : "border-l-4 border-foreground/20";

  const canRefresh = venueId && sessionId && attempts < 3;

  function handleRefresh() {
    if (!canRefresh) return;
    setAttempts((n) => n + 1);
    startTransition(async () => {
      await refreshVenueMetadata({ venueId: venueId!, sessionId: sessionId! });
    });
  }

  if (!metadata?.thumbnail_url && !metadata?.title) {
    return (
      <div className={`flex items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2 text-xs ${borderClass}`}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center gap-2 text-foreground/60 min-w-0"
        >
          <span>{isTikTok ? "🎵" : isInstagram ? "📸" : "🔗"}</span>
          <span className="truncate">{url}</span>
        </a>
        {canRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium text-foreground/40 hover:text-foreground/70 disabled:opacity-50"
            aria-label="Refresh preview"
          >
            {isPending ? "..." : "↻"}
          </button>
        )}
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex gap-3 overflow-hidden rounded-lg bg-foreground/5 ${borderClass}`}
    >
      {metadata?.thumbnail_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={metadata.thumbnail_url}
          alt={metadata.title ?? "preview"}
          className="h-16 w-12 flex-shrink-0 object-cover"
        />
      )}
      <div className="flex min-w-0 flex-col justify-center gap-0.5 py-2 pr-3">
        {metadata?.author_name && (
          <p className="text-xs font-medium text-foreground/50">
            {isTikTok ? "🎵" : "📸"} {metadata.author_name}
          </p>
        )}
        {metadata?.title && (
          <p className="line-clamp-2 text-xs text-foreground/70">
            {metadata.title}
          </p>
        )}
      </div>
    </a>
  );
}
