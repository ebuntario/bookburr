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
) {
  const totalMembers = members.length;
  const progressTotal =
    status === "collecting" || status === "discovering"
      ? expectedSize && expectedSize > totalMembers
        ? expectedSize
        : totalMembers
      : totalMembers;

  const completedMemberIds = new Set<string>();
  if (status !== "voting") {
    // collecting/discovering/confirmed/completed: all joined members are "completed"
    members.forEach((m) => completedMemberIds.add(m.id));
  }
  // voting: completedMemberIds stays empty (anonymous voting)

  const completedCount =
    status === "voting" ? venueVotedCount : totalMembers;

  return { totalMembers, progressTotal, completedMemberIds, completedCount };
}

export function computePendingMembers(
  members: Member[],
  totalMembers: number,
  venueVotedCount: number,
  status: string,
) {
  if (status !== "voting") return [];
  return members.slice(0, totalMembers - venueVotedCount);
}

export function computeDateRange(dates: DateEntry[]): string | undefined {
  if (dates.length === 0) return undefined;
  if (dates.length === 1) return dates[0].date;
  return `${dates[0].date} – ${dates[dates.length - 1].date}`;
}
