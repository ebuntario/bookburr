"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import {
  copyToClipboard,
  buildInvitationCard,
  nativeShare,
} from "@/lib/share-utils";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

interface SharePanelProps {
  sessionName: string;
  inviteCode: string;
  shareUrl: string;
  sessionId: string;
}

export function SharePanel({
  sessionName,
  inviteCode,
  shareUrl,
  sessionId,
}: SharePanelProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(shareUrl);
    if (!ok) return;
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const whatsappHref = buildInvitationCard({ sessionName, shareUrl, inviteCode });

  const handleNativeShare = () => nativeShare(sessionName, shareUrl);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center gap-8 py-8"
    >
      {/* Celebration */}
      <div className="flex flex-col items-center gap-3 text-center">
        <SparklesIcon className="h-12 w-12 text-gold" />
        <h1 className="text-3xl font-bold text-foreground">
          Bukber lu siap!
        </h1>
        <p className="text-foreground/60">
          Tinggal share ke temen-temen buat join
        </p>
      </div>

      {/* Session name */}
      <div className="rounded-2xl bg-gold/10 px-6 py-4 text-center">
        <p className="text-sm text-foreground/50">Nama bukber</p>
        <p className="text-lg font-bold text-foreground">{sessionName}</p>
      </div>

      {/* Invite link */}
      <div className="flex w-full flex-col gap-3">
        <p className="text-sm font-medium text-foreground/60">Link undangan</p>
        <div className="flex items-center gap-2 rounded-xl border border-foreground/10 bg-white px-4 py-3">
          <span className="flex-1 truncate text-sm text-foreground/70">
            {shareUrl}
          </span>
          <Button
            size="sm"
            onPress={handleCopyLink}
            className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-white"
          >
            {linkCopied ? "Tersalin!" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex w-full flex-col gap-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green py-3 font-semibold text-white"
        >
          <WhatsAppIcon className="h-5 w-5" /> Share via WhatsApp
        </a>

        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button
            onPress={handleNativeShare}
            variant="outline"
            className="w-full rounded-xl border-foreground/20 py-3 font-semibold text-foreground"
          >
            Share lainnya...
          </Button>
        )}
      </div>

      {/* Dashboard link */}
      <Link
        href={`/sessions/${sessionId}`}
        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gold/15 px-6 py-3 text-sm font-semibold text-gold transition-colors active:bg-gold/25"
      >
        Ke Dashboard Bukber <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
