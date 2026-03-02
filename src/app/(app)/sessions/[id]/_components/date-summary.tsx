interface DateEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  stronglyPrefer: number;
  canDo: number;
  unavailable: number;
}

import { formatDateShort } from "@/lib/format-utils";

interface DateSummaryProps {
  dates: DateEntry[];
  totalMembers: number;
  votedMemberCount: number;
}

export function DateSummary({
  dates,
  totalMembers,
  votedMemberCount,
}: DateSummaryProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground/60">
          Tanggal Kandidat
        </h3>
        <span className="text-xs text-foreground/40">
          {votedMemberCount}/{totalMembers} orang udah vote
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {dates.map((d) => {
          const total = d.stronglyPrefer + d.canDo + d.unavailable;

          return (
            <div key={d.id} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground/70">
                {formatDateShort(d.date)}
              </span>

              {/* Stacked bar */}
              <div className="flex h-2 overflow-hidden rounded-full bg-foreground/8">
                {total === 0 ? (
                  <div className="flex-1 bg-foreground/10" />
                ) : (
                  <>
                    {d.stronglyPrefer > 0 && (
                      <div
                        className="bg-primary"
                        style={{ flex: d.stronglyPrefer, minWidth: 4 }}
                      />
                    )}
                    {d.canDo > 0 && (
                      <div
                        className="bg-teal"
                        style={{ flex: d.canDo, minWidth: 4 }}
                      />
                    )}
                    {d.unavailable > 0 && (
                      <div
                        className="bg-danger/60"
                        style={{ flex: d.unavailable, minWidth: 4 }}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Text counts */}
              {total > 0 && (
                <div className="flex gap-2 text-xs">
                  {d.stronglyPrefer > 0 && (
                    <span className="text-primary font-medium">
                      {d.stronglyPrefer} bisa banget
                    </span>
                  )}
                  {d.canDo > 0 && (
                    <span className="text-teal font-medium">
                      {d.canDo} bisa
                    </span>
                  )}
                  {d.unavailable > 0 && (
                    <span className="text-danger/70 font-medium">
                      {d.unavailable} gabisa
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
