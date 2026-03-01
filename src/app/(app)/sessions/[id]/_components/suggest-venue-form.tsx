"use client";

import { useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { suggestVenue } from "@/lib/actions/venues";

interface SuggestVenueFormProps {
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function SuggestVenueForm({
  sessionId,
  onClose,
  onSuccess,
}: SuggestVenueFormProps) {
  const [name, setName] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);

    const result = await suggestVenue({
      sessionId,
      name: name.trim(),
      socialLinkUrl: socialUrl.trim() || null,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="px-5 pb-8 pt-5 flex flex-col gap-4 max-h-[90dvh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-heading font-medium text-foreground">
          Suggest Tempat
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-foreground/40"
        >
          Batal
        </button>
      </div>

      {/* Venue name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
          Nama Tempat *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Warung Nasi Rendang Pak Udin"
          className="w-full rounded-xl border border-foreground/20 bg-white px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary transition-colors"
          autoFocus
        />
      </div>

      {/* Social link */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
          Link TikTok / Instagram{" "}
          <span className="font-normal text-foreground/30">(opsional)</span>
        </label>
        <input
          type="url"
          value={socialUrl}
          onChange={(e) => setSocialUrl(e.target.value)}
          placeholder="https://tiktok.com/@..."
          className="w-full rounded-xl border border-foreground/20 bg-white px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary transition-colors"
        />
        <p className="text-xs text-foreground/40">
          Tambahin reviewnya biar orang lain bisa liat dulu sebelum vote
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!name.trim() || submitting}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-danger py-3.5 text-sm font-medium text-white transition-opacity active:opacity-70 disabled:opacity-40"
      >
        {submitting ? "Lagi kirim..." : <><PaperAirplaneIcon className="h-4 w-4" /> Suggest Sekarang</>}
      </button>
    </div>
  );
}
