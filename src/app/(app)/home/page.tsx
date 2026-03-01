import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSessionsByUserId } from "@/lib/queries/sessions";
import { SessionCard } from "./_components/session-card";
import { SessionCardList, SessionCardItem } from "./_components/session-card-list";
import { EmptyState } from "./_components/empty-state";

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const sessions = await getSessionsByUserId(userId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold">List Bukber</h2>
        {sessions.length > 0 && (
          <Link
            href="/sessions/new"
            className="rounded-full bg-danger px-4 py-2 text-sm font-medium text-white"
          >
            + Bikin
          </Link>
        )}
      </div>

      {sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <SessionCardList>
          {sessions.map((s) => (
            <SessionCardItem key={s.id}>
              <SessionCard
                id={s.id}
                name={s.name}
                mode={s.mode}
                sessionShape={s.sessionShape}
                status={s.status}
                memberCount={s.memberCount}
                createdAt={s.createdAt.toISOString()}
                earliestDate={s.earliestDate}
                latestDate={s.latestDate}
              />
            </SessionCardItem>
          ))}
        </SessionCardList>
      )}
    </div>
  );
}
