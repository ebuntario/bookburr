import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { auth } from "@/lib/auth";
import { getUserProfile, getUserStats } from "@/lib/queries/profile";
import { ProfileForm } from "./_components/profile-form";
import { ProfileStats } from "./_components/profile-stats";
import { SignOutButton } from "./_components/sign-out-button";

export const metadata = { title: "Profil — BookBurr" };

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [profile, stats] = await Promise.all([
    getUserProfile(userId),
    getUserStats(userId),
  ]);

  if (!profile) redirect("/login");

  const safeArray = (val: unknown): string[] =>
    Array.isArray(val) ? (val as string[]) : [];

  return (
    <div className="flex flex-col gap-6 pb-24">
      <Link href="/home" className="flex items-center gap-1.5 text-sm font-medium text-foreground/50 transition-colors active:text-foreground/70 w-fit">
        <ArrowLeftIcon className="h-4 w-4" />
        Kembali
      </Link>

      {/* Avatar + name header */}
      <div className="flex flex-col items-center gap-3 pt-2">
        {profile.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.image}
            alt={profile.name ?? "Avatar"}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/20">
            <span className="text-2xl font-bold text-gold">
              {(
                profile.name ??
                profile.email?.split("@")[0] ??
                "U"
              )[0].toUpperCase()}
            </span>
          </div>
        )}
        <div className="text-center">
          <p className="text-base font-bold text-foreground">
            {profile.name ?? profile.email?.split("@")[0] ?? "Anon"}
          </p>
          <p className="text-xs text-foreground/50">{profile.email}</p>
        </div>
      </div>

      <ProfileStats
        totalSessions={stats.totalSessions}
        sessionsHosted={stats.sessionsHosted}
      />

      <ProfileForm
        name={profile.name}
        email={profile.email}
        maritalStatus={profile.maritalStatus}
        dietaryPreferences={safeArray(profile.dietaryPreferences)}
        defaultCuisinePreferences={safeArray(profile.defaultCuisinePreferences)}
      />

      <div className="mt-2">
        <SignOutButton />
      </div>
    </div>
  );
}
