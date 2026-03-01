import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import {
  getSessionWithDates,
  getSessionOgData,
  getMemberByUserAndSession,
  getUserConfirmedDates,
} from "@/lib/queries/sessions";
import { JoinWizard } from "./_components/join-wizard";
import type { SessionShape } from "@/lib/constants";

function formatDateRange(earliest: string | null, latest: string | null) {
  if (!earliest) return "";
  const fmt = (d: string) => {
    const [, m, day] = d.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${parseInt(day)} ${months[parseInt(m) - 1]}`;
  };
  if (!latest || earliest === latest) return fmt(earliest);
  return `${fmt(earliest)} – ${fmt(latest)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const og = await getSessionOgData(id);
  if (!og) return { title: "Join Bukber — BookBurr" };

  const dateStr = formatDateRange(og.earliestDate, og.latestDate);
  const parts: string[] = [];
  if (og.hostName) parts.push(`by ${og.hostName}`);
  if (og.memberCount > 0) parts.push(`${og.memberCount} joined`);
  if (dateStr) parts.push(dateStr);
  const description = parts.length > 0
    ? `Join bukber "${og.name}" — ${parts.join(" · ")}`
    : `Join bukber "${og.name}" di BookBurr`;

  const title = `${og.name} — Join Bukber`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id: sessionId }] = await Promise.all([auth(), params]);
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [result, existingMember, confirmedDates] = await Promise.all([
    getSessionWithDates(sessionId),
    getMemberByUserAndSession(userId, sessionId),
    getUserConfirmedDates(userId, sessionId),
  ]);

  if (!result) notFound();
  if (existingMember) redirect(`/sessions/${sessionId}`);
  if (
    result.session.status === "confirmed" ||
    result.session.status === "completed"
  ) {
    redirect(`/sessions/${sessionId}`);
  }

  // Build conflict map: date string → session names[]
  const conflictDates: Record<string, string[]> = {};
  for (const row of confirmedDates) {
    if (!conflictDates[row.date]) conflictDates[row.date] = [];
    conflictDates[row.date].push(row.sessionName);
  }

  return (
    <Suspense>
      <JoinWizard
        session={{
          id: result.session.id,
          name: result.session.name,
          mode: result.session.mode,
          status: result.session.status,
          sessionShape: (result.session.sessionShape ?? "need_both") as SessionShape,
          dateRangeStart: result.session.dateRangeStart ?? null,
          dateRangeEnd: result.session.dateRangeEnd ?? null,
          datesLocked: result.session.datesLocked ?? false,
        }}
        dateOptions={result.dateOptions}
        conflictDates={conflictDates}
      />
    </Suspense>
  );
}
