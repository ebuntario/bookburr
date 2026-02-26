"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";

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
  const [codeCopied, setCodeCopied] = useState(false);

  const copyToClipboard = async (text: string, type: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "link") {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } else {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      }
    } catch {
      // fallback — ignore
    }
  };

  const whatsappText = encodeURIComponent(
    `Yuk bukber bareng! Join "${sessionName}" di BookBurr 🌙\n\nKlik link: ${shareUrl}\n\nAtau pake kode: ${inviteCode}`,
  );

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `Bukber: ${sessionName}`,
        text: `Yuk join bukber "${sessionName}" di BookBurr!`,
        url: shareUrl,
      });
    } catch {
      // user cancelled — ignore
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center gap-8 py-8"
    >
      {/* Celebration */}
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-5xl">🎉</span>
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
            onPress={() => copyToClipboard(shareUrl, "link")}
            className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-white"
          >
            {linkCopied ? "Tersalin!" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Invite code */}
      <div className="flex w-full flex-col gap-3">
        <p className="text-sm font-medium text-foreground/60">
          Kode buat WhatsApp Bot
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-foreground/10 bg-white px-4 py-3">
          <span className="flex-1 font-mono text-lg font-bold tracking-wider text-foreground">
            {inviteCode}
          </span>
          <Button
            size="sm"
            onPress={() => copyToClipboard(inviteCode, "code")}
            className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-white"
          >
            {codeCopied ? "Tersalin!" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex w-full flex-col gap-3">
        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green py-3 font-semibold text-white"
        >
          <span>💬</span> Share via WhatsApp
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
        className="mt-4 text-sm font-semibold text-gold underline underline-offset-4"
      >
        Ke Dashboard Bukber →
      </Link>
    </motion.div>
  );
}
