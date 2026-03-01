"use client";

import { useState } from "react";
import { LinkIcon, CheckIcon } from "@heroicons/react/24/outline";
import {
  copyToClipboard,
  buildInvitationCard,
  nativeShare,
} from "@/lib/share-utils";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { BottomSheet } from "@/components/bottom-sheet";

interface InviteButtonProps {
  sessionId: string;
  sessionName: string;
  inviteCode: string;
  shareUrl: string;
  hostName?: string;
  dateRange?: string;
}

export function InviteButton({
  sessionName,
  inviteCode,
  shareUrl,
  hostName,
  dateRange,
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

  const whatsappHref = buildInvitationCard({ hostName, sessionName, dateRange, shareUrl, inviteCode });

  return (
    <>
      <button
        type="button"
        onClick={handleMainShare}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-foreground/15 bg-white px-4 py-3 text-sm font-semibold text-foreground transition-colors active:bg-foreground/5"
      >
        <LinkIcon className="h-4 w-4" />
        Invite Temen
      </button>

      <BottomSheet open={showSheet} onClose={() => setShowSheet(false)}>
        <div className="flex flex-col gap-4 p-6 pb-8">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">Share Bukber</h3>
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
            <WhatsAppIcon className="h-5 w-5" /> Share via WhatsApp
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 rounded-xl border border-foreground/20 py-3 font-semibold text-foreground"
          >
            {copied ? (
              <><CheckIcon className="h-4 w-4 text-green" /> Link tersalin!</>
            ) : (
              "Copy Link"
            )}
          </button>

          <div className="text-center">
            <p className="text-xs text-foreground/40">Kode join</p>
            <p className="font-mono text-lg font-bold tracking-widest text-foreground">
              {inviteCode}
            </p>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
