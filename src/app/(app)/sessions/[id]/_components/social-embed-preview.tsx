interface SocialEmbedPreviewProps {
  platform: string;
  metadata: {
    title?: string;
    thumbnail_url?: string;
    author_name?: string;
  } | null;
  url: string;
}

export function SocialEmbedPreview({
  platform,
  metadata,
  url,
}: SocialEmbedPreviewProps) {
  const isTikTok = platform === "tiktok";
  const isInstagram = platform === "instagram";

  const borderClass = isTikTok
    ? "border-l-4 border-black"
    : isInstagram
      ? "border-l-4 border-pink-500"
      : "border-l-4 border-foreground/20";

  if (!metadata?.thumbnail_url && !metadata?.title) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2 text-xs text-foreground/60 ${borderClass}`}
      >
        <span>{isTikTok ? "🎵" : isInstagram ? "📸" : "🔗"}</span>
        <span className="truncate">{url}</span>
      </a>
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
