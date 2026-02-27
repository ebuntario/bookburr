import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getSessionWithMembers,
  getDatesWithVoteCounts,
  getVenuesForSession,
  getRecentActivity,
} from "@/lib/queries/dashboard";
import { getMemberByUserAndSession } from "@/lib/queries/sessions";
import { SessionHeader } from "./_components/session-header";
import { StatusProgress } from "./_components/status-progress";
import { MemberAvatars } from "./_components/member-avatars";
import { DateSummary } from "./_components/date-summary";
import { VenueSection } from "./_components/venue-section";
import { ActivityPreview } from "./_components/activity-preview";
import { InviteButton } from "./_components/invite-button";
import { HostControls } from "./_components/host-controls";
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

  // 4 parallel queries: session+members, dates, venues, activity+membership check
  const [sessionData, datesData, venuesData, [recentActivity, currentMember]] =
    await Promise.all([
      getSessionWithMembers(sessionId),
      getDatesWithVoteCounts(sessionId),
      getVenuesForSession(sessionId),
      Promise.all([
        getRecentActivity(sessionId, 5),
        getMemberByUserAndSession(userId, sessionId),
      ]),
    ]);

  if (!sessionData) notFound();
  if (!currentMember) redirect(`/sessions/${sessionId}/join`);

  const isHost = sessionData.session.hostId === userId;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://bookburr.com";
  const shareUrl = `${baseUrl}/sessions/${sessionId}/join`;
  const status = sessionData.session.status;

  return (
    <div className="flex flex-col gap-5 pb-24">
      <SessionHeader
        name={sessionData.session.name}
        mode={sessionData.session.mode}
        status={status}
        isHost={isHost}
      />

      <StatusProgress status={status} />

      <MemberAvatars members={sessionData.members} />

      {datesData.dates.length > 0 && (
        <DateSummary
          dates={datesData.dates}
          totalMembers={sessionData.members.length}
          votedMemberCount={datesData.votedMemberCount}
        />
      )}

      <VenueSection
        status={status as SessionStatus}
        isHost={isHost}
        venueCount={venuesData.length}
      />

      {isHost && (
        <HostControls
          sessionId={sessionId}
          status={status}
          memberCount={sessionData.members.length}
          venueCount={venuesData.length}
          shareUrl={shareUrl}
          dates={datesData.dates.map((d) => ({ id: d.id, date: d.date }))}
          venues={venuesData}
        />
      )}

      <ActivityPreview sessionId={sessionId} activities={recentActivity} />

      <InviteButton
        sessionId={sessionId}
        sessionName={sessionData.session.name}
        inviteCode={sessionData.session.inviteCode}
        shareUrl={shareUrl}
      />
    </div>
  );
}
