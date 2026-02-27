"use client";

import { useState } from "react";
import {
  copyToClipboard,
  buildWhatsAppShareUrl,
  nativeShare,
} from "@/lib/share-utils";

interface InviteButtonProps {
  sessionId: string;
  sessionName: string;
  inviteCode: string;
  shareUrl: string;
}

export function InviteButton({
  sessionName,
  inviteCode,
  shareUrl,
}: InviteButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showSheet, setShowSheet] = useState(false);

  const handleMainShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      await nativeShare(sessionName, shareUrl);
    } else {
      setShowSheet(true);
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const whatsappHref = buildWhatsAppShareUrl(sessionName, shareUrl, inviteCode);

  return (
    <>
      <button
        type="button"
        onClick={handleMainShare}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-foreground/15 bg-white px-4 py-3 text-sm font-semibold text-foreground transition-colors active:bg-foreground/5"
      >
        <span>🔗</span>
        Invite Temen
      </button>

      {/* Bottom sheet */}
      {showSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setShowSheet(false)}
        >
          <div
            className="w-full rounded-t-2xl bg-white p-6 pb-8 shadow-xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-foreground">
                Share Bukber
              </h3>
              <button
                type="button"
                onClick={() => setShowSheet(false)}
                className="text-foreground/40 text-sm"
              >
                Tutup
              </button>
            </div>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-green py-3 font-semibold text-white"
              onClick={() => setShowSheet(false)}
            >
              <span>💬</span> Share via WhatsApp
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 rounded-xl border border-foreground/20 py-3 font-semibold text-foreground"
            >
              {copied ? "✓ Link tersalin!" : "Copy Link"}
            </button>

            <div className="text-center">
              <p className="text-xs text-foreground/40">Kode join</p>
              <p className="font-mono text-lg font-bold tracking-widest text-foreground">
                {inviteCode}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
