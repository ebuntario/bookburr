const MAX_VISIBLE = 6;

const AVATAR_COLORS = [
  "bg-primary",
  "bg-teal",
  "bg-danger",
  "bg-success",
] as const;

function getAvatarColor(userId: string): string {
  const sum = userId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function getDisplayName(name: string | null, email: string): string {
  return name ?? email.split("@")[0];
}

interface Member {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface MemberAvatarsProps {
  members: Member[];
}

export function MemberAvatars({ members }: MemberAvatarsProps) {
  const visible = members.slice(0, MAX_VISIBLE);
  const overflow = members.length - MAX_VISIBLE;

  return (
    <div className="flex flex-col gap-2">
      <div
        role="group"
        aria-label={`${members.length} anggota`}
        className="flex items-center"
      >
        {visible.map((member, i) => {
          const displayName = getDisplayName(member.name, member.email);
          const initial = displayName[0]?.toUpperCase() ?? "?";
          const color = getAvatarColor(member.userId);

          return (
            <div
              key={member.id}
              className="relative h-8 w-8 rounded-full border-2 border-white flex items-center justify-center shrink-0"
              style={{ marginLeft: i === 0 ? 0 : -8, zIndex: MAX_VISIBLE - i }}
              title={displayName}
            >
              {member.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.image}
                  alt={displayName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div
                  className={`h-full w-full rounded-full flex items-center justify-center ${color}`}
                >
                  <span className="text-xs font-medium text-white">{initial}</span>
                </div>
              )}
            </div>
          );
        })}

        {overflow > 0 && (
          <div
            className="relative h-8 w-8 rounded-full border-2 border-white bg-foreground/10 flex items-center justify-center shrink-0"
            style={{ marginLeft: -8 }}
            aria-label={`${overflow} anggota lainnya`}
          >
            <span className="text-xs font-medium text-foreground/60">
              +{overflow}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-foreground/50">
        {members.length} orang udah join
      </p>
    </div>
  );
}
