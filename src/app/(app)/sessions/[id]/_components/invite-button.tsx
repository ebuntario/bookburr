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

function getStatusCopy(status: string): { label: string; title: string } {
  switch (status) {
    case "voting":
      return { label: "Share Voting", title: "Share Voting" };
    case "confirmed":
    case "completed":
      return { label: "Share ke Temen", title: "Share Info Bukber" };
    default:
      return { label: "Invite Temen", title: "Share Bukber" };
  }
}

function buildWhatsAppHref(
  status: string,
  session: { sessionName: string; shareUrl: string; inviteCode: string; hostName?: string; dateRange?: string },
  confirmedVenue?: { name: string; dateStr: string; googleMapsUrl?: string },
  venueCount?: number,
): string {
  if (
    (status === "confirmed" || status === "completed") &&
    confirmedVenue
  ) {
    return buildConfirmationCard({
      sessionName: session.sessionName,
      venueName: confirmedVenue.name,
      dateStr: confirmedVenue.dateStr,
      googleMapsUrl: confirmedVenue.googleMapsUrl,
    });
  }
  if (status === "voting" && venueCount) {
    return buildVotingOpenCard({
      sessionName: session.sessionName,
      venueCount,
      shareUrl: session.shareUrl,
    });
  }
  return buildInvitationCard({
    hostName: session.hostName,
    sessionName: session.sessionName,
    dateRange: session.dateRange,
    shareUrl: session.shareUrl,
    inviteCode: session.inviteCode,
  });
}

function createCopyHandler(
  text: string,
  setter: (v: boolean) => void,
) {
  return async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setter(true);
      setTimeout(() => setter(false), 2000);
    }
  };
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

  const handleCopyLink = createCopyHandler(shareUrl, setCopied);
  const handleCopyCode = createCopyHandler(inviteCode, setCodeCopied);

  const whatsappHref = buildWhatsAppHref(
    status,
    { sessionName, shareUrl, inviteCode, hostName, dateRange },
    confirmedVenueName && confirmedDateStr
      ? { name: confirmedVenueName, dateStr: confirmedDateStr, googleMapsUrl }
      : undefined,
    venueCount,
  );

  const { label, title: sheetTitle } = getStatusCopy(status);
  const showInviteCode =
    status === "collecting" || status === "discovering";

  return (
    <>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-foreground/15 bg-white px-4 py-3 text-sm font-medium text-foreground transition-colors active:bg-foreground/5"
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4 text-success" />
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
            <h3 className="font-heading font-medium text-foreground">{sheetTitle}</h3>
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
            className="flex items-center justify-center gap-2 rounded-xl bg-success py-3 font-medium text-white"
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
            className="flex items-center justify-center gap-2 rounded-xl border border-foreground/20 py-3 font-medium text-foreground"
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
              <p className="font-mono text-lg font-heading font-semibold tracking-widest text-foreground">
                {codeCopied ? (
                  <span className="text-success">Kode tersalin!</span>
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
