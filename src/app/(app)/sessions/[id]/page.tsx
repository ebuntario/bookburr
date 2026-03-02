import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getSessionWithMembers,
  getDatesWithVoteCounts,
  getVenuesForSession,
  getVenueVotedMemberCount,
  getActivityFeed,
  getMemberVoteStatus,
} from "@/lib/queries/dashboard";
import { getMemberByUserAndSession } from "@/lib/queries/sessions";
import { SessionHeader } from "./_components/session-header";
import { StatusProgress } from "./_components/status-progress";
import { SessionProgress } from "./_components/session-progress";
import { WaitingOnList } from "./_components/waiting-on-list";
import { DateVotingResults } from "./_components/date-voting-results";
import { VenueSection } from "./_components/venue-section";
import { ActivityPreview } from "./_components/activity-preview";
import { PendingActionBanner } from "./_components/pending-action-banner";
import { InviteButton } from "./_components/invite-button";
import { HostControls } from "./_components/host-controls";
import { RealtimeDashboardWrapper } from "./_components/realtime-dashboard-wrapper";
import {
  computeProgressData,
  computePendingMembers,
  computeDateRange,
} from "./_components/dashboard-helpers";
import type { SessionStatus, SessionShape } from "@/lib/constants";
import { SESSION_SHAPE } from "@/lib/constants";
import { formatDateNoYear, buildGoogleMapsUrl } from "@/lib/format-utils";

function extractHostName(
  members: { userId: string; name: string | null; email: string | null }[],
  hostId: string,
): string | undefined {
  const host = members.find((m) => m.userId === hostId);
  return host?.name ?? host?.email?.split("@")[0] ?? undefined;
}

export const metadata = { title: "Dashboard Bukber — BookBurr" };

export default async function SessionDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id: sessionId }] = await Promise.all([auth(), params]);
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [sessionData, [recentActivity, currentMember]] = await Promise.all([
    getSessionWithMembers(sessionId),
    Promise.all([
      getActivityFeed(sessionId, 5),
      getMemberByUserAndSession(userId, sessionId),
    ]),
  ]);

  if (!sessionData) notFound();
  if (!currentMember) redirect(`/sessions/${sessionId}/join`);

  const [datesData, venuesData, memberVoteStatus, venueVotedCount] = await Promise.all([
    getDatesWithVoteCounts(sessionId, currentMember.id),
    getVenuesForSession(sessionId, currentMember.id),
    getMemberVoteStatus(sessionId, currentMember.id),
    getVenueVotedMemberCount(sessionId),
  ]);

  const isHost = sessionData.session.hostId === userId;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://bookburr.com";
  const shareUrl = `${baseUrl}/sessions/${sessionId}/join`;
  const status = sessionData.session.status;
  const sessionShape = (sessionData.session.sessionShape ?? SESSION_SHAPE.need_both) as SessionShape;
  const hostName = extractHostName(sessionData.members, sessionData.session.hostId);
  const dateRange = computeDateRange(datesData.dates);

  const hasVotedOnDates = datesData.dates.some((d) => d.myVote !== null);
  const canEditDates = status === "collecting" || status === "discovering";

  const confirmedVenue = venuesData.find(
    (v) => v.id === sessionData.session.confirmedVenueId,
  );
  const confirmedDate = datesData.dates.find(
    (d) => d.id === sessionData.session.confirmedDateOptionId,
  );

  const dateVotedMemberIds = new Set(datesData.votedMemberIds);

  const { progressTotal, completedMemberIds, completedCount } =
    computeProgressData(
      sessionData.members,
      sessionData.session.expectedGroupSize,
      status,
      venueVotedCount,
      dateVotedMemberIds,
    );

  const pendingMembersForList = computePendingMembers(
    sessionData.members,
    completedMemberIds,
    venueVotedCount,
    status,
  );

  return (
    <RealtimeDashboardWrapper sessionId={sessionId}>
    <div className="flex flex-col gap-5 pb-24">
      <SessionHeader
        name={sessionData.session.name}
        mode={sessionData.session.mode}
        status={status}
        isHost={isHost}
      />

      <StatusProgress status={status} />

      <SessionProgress
        completedCount={completedCount}
        totalCount={progressTotal}
        members={sessionData.members}
        completedMemberIds={completedMemberIds}
        status={status}
      />

      <WaitingOnList
        pendingMembers={pendingMembersForList}
        status={status}
      />

      {sessionShape !== SESSION_SHAPE.date_known && datesData.dates.length > 0 && (
        <PendingActionBanner hasVoted={hasVotedOnDates} canEdit={canEditDates} />
      )}

      {/* Date section: skip for date_known (show simple confirmed card) */}
      {sessionShape === SESSION_SHAPE.date_known ? (
        confirmedDate && (
          <div className="rounded-2xl border border-foreground/10 bg-white px-5 py-4">
            <p className="text-xs font-medium text-foreground/40">Tanggal fix</p>
            <p className="font-heading text-lg font-medium">
              {formatDateNoYear(confirmedDate.date)}
            </p>
          </div>
        )
      ) : (
        datesData.dates.length > 0 && (
          <div id="date-section">
            <DateVotingResults
              sessionId={sessionId}
              memberId={currentMember.id}
              dates={datesData.dates}
              totalMembers={sessionData.members.length}
              votedMemberCount={datesData.votedMemberCount}
              status={status}
              topVenueName={venuesData[0]?.name}
            />
          </div>
        )
      )}

      {/* Venue section: for venue_known, show preset venue info */}
      {sessionShape === SESSION_SHAPE.venue_known ? (
        venuesData.length > 0 && (
          <div className="rounded-2xl border border-foreground/10 bg-white px-5 py-4">
            <p className="text-xs font-medium text-foreground/40">Tempat fix</p>
            <p className="font-heading text-lg font-medium">{venuesData[0].name}</p>
          </div>
        )
      ) : (
        <VenueSection
          sessionId={sessionId}
          status={status as SessionStatus}
          isHost={isHost}
          venues={venuesData}
          isTerserah={memberVoteStatus.isTerserah}
        />
      )}

      {isHost && (
        <HostControls
          sessionId={sessionId}
          sessionName={sessionData.session.name}
          status={status}
          sessionShape={sessionShape}
          memberCount={sessionData.members.length}
          venueCount={venuesData.length}
          dates={datesData.dates}
          venues={venuesData}
          hasViableDates={datesData.dates.some(
            (d) => d.stronglyPrefer > 0 || d.canDo > 0,
          )}
        />
      )}

      <ActivityPreview sessionId={sessionId} activities={recentActivity} />

      <InviteButton
        sessionId={sessionId}
        sessionName={sessionData.session.name}
        inviteCode={sessionData.session.inviteCode}
        shareUrl={shareUrl}
        status={status}
        hostName={hostName}
        dateRange={dateRange}
        venueCount={venuesData.length}
        confirmedVenueName={confirmedVenue?.name}
        confirmedDateStr={confirmedDate?.date}
        googleMapsUrl={buildGoogleMapsUrl(confirmedVenue?.location as { lat?: number; lng?: number } | null)}
      />
    </div>
    </RealtimeDashboardWrapper>
  );
}
