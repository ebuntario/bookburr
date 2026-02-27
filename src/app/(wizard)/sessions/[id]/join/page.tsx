import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import {
  getSessionWithDates,
  getMemberByUserAndSession,
  getUserConfirmedDates,
} from "@/lib/queries/sessions";
import { JoinWizard } from "./_components/join-wizard";

export const metadata = { title: "Join Bukber — BookBurr" };

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
        }}
        dateOptions={result.dateOptions}
        conflictDates={conflictDates}
      />
    </Suspense>
  );
}
