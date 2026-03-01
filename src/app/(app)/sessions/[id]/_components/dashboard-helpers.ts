interface Member {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  joinedVia: string;
  createdAt: Date;
}

interface DateEntry {
  date: string;
}

export function computeProgressData(
  members: Member[],
  expectedSize: number | null,
  status: string,
  venueVotedCount: number,
  dateVotedMemberIds: Set<string>,
) {
  const totalMembers = members.length;
  const progressTotal =
    status === "collecting" || status === "discovering"
      ? expectedSize && expectedSize > totalMembers
        ? expectedSize
        : totalMembers
      : totalMembers;

  const completedMemberIds = new Set<string>();
  if (status === "collecting" || status === "discovering") {
    members.forEach((m) => {
      if (dateVotedMemberIds.has(m.id)) completedMemberIds.add(m.id);
    });
  } else if (status !== "voting") {
    // confirmed/completed: all joined members are "completed"
    members.forEach((m) => completedMemberIds.add(m.id));
  }
  // voting: completedMemberIds stays empty (anonymous voting)

  const completedCount =
    status === "voting"
      ? venueVotedCount
      : status === "collecting" || status === "discovering"
        ? completedMemberIds.size
        : totalMembers;

  return { totalMembers, progressTotal, completedMemberIds, completedCount };
}

export function computePendingMembers(
  members: Member[],
  completedMemberIds: Set<string>,
  venueVotedCount: number,
  status: string,
) {
  if (status === "collecting" || status === "discovering") {
    return members.filter((m) => !completedMemberIds.has(m.id));
  }
  if (status === "voting") {
    return members.slice(0, members.length - venueVotedCount);
  }
  return [];
}

export function computeDateRange(dates: DateEntry[]): string | undefined {
  if (dates.length === 0) return undefined;
  if (dates.length === 1) return dates[0].date;
  return `${dates[0].date} – ${dates[dates.length - 1].date}`;
}
