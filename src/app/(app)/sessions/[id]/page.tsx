import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getSessionWithMembers,
  getDatesWithVoteCounts,
  getRecentActivity,
} from "@/lib/queries/dashboard";
import { getMemberByUserAndSession } from "@/lib/queries/sessions";
import { SessionHeader } from "./_components/session-header";
import { MemberAvatars } from "./_components/member-avatars";
import { DateSummary } from "./_components/date-summary";
import { VenueSection } from "./_components/venue-section";
import { ActivityPreview } from "./_components/activity-preview";
import { InviteButton } from "./_components/invite-button";
import type { SessionStatus } from "@/lib/constants";

export const metadata = { title: "Dashboard Bukber — BookBurr" };

export default async function SessionDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id: sessionId }] = await Promise.all([auth(), params]);
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  // Run 3 queries in parallel: session+members, dates, activity+membership check
  const [sessionData, datesData, [recentActivity, currentMember]] =
    await Promise.all([
      getSessionWithMembers(sessionId),
      getDatesWithVoteCounts(sessionId),
      Promise.all([
        getRecentActivity(sessionId, 5),
        getMemberByUserAndSession(userId, sessionId),
      ]),
    ]);

  if (!sessionData) notFound();
  if (!currentMember) redirect(`/sessions/${sessionId}/join`);

  const isHost = sessionData.session.hostId === userId;
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://bookburr.com";
  const shareUrl = `${baseUrl}/sessions/${sessionId}/join`;

  return (
    <div className="flex flex-col gap-5 pb-24">
      <SessionHeader
        name={sessionData.session.name}
        mode={sessionData.session.mode}
        status={sessionData.session.status}
        isHost={isHost}
      />

      <MemberAvatars members={sessionData.members} />

      {datesData.dates.length > 0 && (
        <DateSummary
          dates={datesData.dates}
          totalMembers={sessionData.members.length}
          votedMemberCount={datesData.votedMemberCount}
        />
      )}

      <VenueSection
        status={sessionData.session.status as SessionStatus}
        isHost={isHost}
      />

      <ActivityPreview activities={recentActivity} />

      <InviteButton
        sessionId={sessionId}
        sessionName={sessionData.session.name}
        inviteCode={sessionData.session.inviteCode}
        shareUrl={shareUrl}
      />
    </div>
  );
}
