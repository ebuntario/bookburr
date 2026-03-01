"use client";

import { useState } from "react";
import {
  LinkIcon,
  CheckIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import {
  copyToClipboard,
  buildInvitationCard,
  buildVotingOpenCard,
  buildConfirmationCard,
  nativeShare,
} from "@/lib/share-utils";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { BottomSheet } from "@/components/bottom-sheet";

interface InviteButtonProps {
  sessionId: string;
  sessionName: string;
  inviteCode: string;
  shareUrl: string;
  status: string;
  hostName?: string;
  dateRange?: string;
  venueCount?: number;
  confirmedVenueName?: string;
  confirmedDateStr?: string;
  googleMapsUrl?: string;
}

function getStatusLabel(status: string) {
  switch (status) {
    case "voting":
      return "Share Voting";
    case "confirmed":
    case "completed":
      return "Share ke Temen";
    default:
      return "Invite Temen";
  }
}

function getSheetTitle(status: string) {
  switch (status) {
    case "voting":
      return "Share Voting";
    case "confirmed":
    case "completed":
      return "Share Info Bukber";
    default:
      return "Share Bukber";
  }
}

export function InviteButton({
  sessionName,
  inviteCode,
  shareUrl,
  status,
  hostName,
  dateRange,
  venueCount,
  confirmedVenueName,
  confirmedDateStr,
  googleMapsUrl,
}: InviteButtonProps) {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showSheet, setShowSheet] = useState(false);

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(inviteCode);
    if (ok) {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const whatsappHref = (() => {
    if (
      (status === "confirmed" || status === "completed") &&
      confirmedVenueName &&
      confirmedDateStr
    ) {
      return buildConfirmationCard({
        sessionName,
        venueName: confirmedVenueName,
        dateStr: confirmedDateStr,
        googleMapsUrl,
      });
    }
    if (status === "voting" && venueCount) {
      return buildVotingOpenCard({ sessionName, venueCount, shareUrl });
    }
    return buildInvitationCard({
      hostName,
      sessionName,
      dateRange,
      shareUrl,
      inviteCode,
    });
  })();

  const label = getStatusLabel(status);
  const sheetTitle = getSheetTitle(status);
  const showInviteCode =
    status === "collecting" || status === "discovering";

  return (
    <>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-foreground/15 bg-white px-4 py-3 text-sm font-semibold text-foreground transition-colors active:bg-foreground/5"
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4 text-green" />
              Link tersalin!
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4" />
              {label}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowSheet(true)}
          className="flex items-center justify-center rounded-xl border border-foreground/15 bg-white px-4 py-3 text-foreground transition-colors active:bg-foreground/5"
          aria-label="Share options"
        >
          <ShareIcon className="h-5 w-5" />
        </button>
      </div>

      <BottomSheet open={showSheet} onClose={() => setShowSheet(false)}>
        <div className="flex flex-col gap-4 p-6 pb-8">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{sheetTitle}</h3>
            <button
              type="button"
              onClick={() => setShowSheet(false)}
              className="text-sm text-foreground/40"
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
            onClick={() => {
              handleCopyLink();
              setShowSheet(false);
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-foreground/20 py-3 font-semibold text-foreground"
          >
            Copy Link
          </button>

          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              type="button"
              onClick={() => {
                void nativeShare(sessionName, shareUrl);
                setShowSheet(false);
              }}
              className="py-2 text-center text-sm text-foreground/50"
            >
              Bagikan lewat cara lain...
            </button>
          )}

          {showInviteCode && (
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-center"
            >
              <p className="text-xs text-foreground/40">Kode join</p>
              <p className="font-mono text-lg font-bold tracking-widest text-foreground">
                {codeCopied ? (
                  <span className="text-green">Kode tersalin!</span>
                ) : (
                  inviteCode
                )}
              </p>
            </button>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
