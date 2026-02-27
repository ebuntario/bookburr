import Link from "next/link";
import { auth } from "@/lib/auth";
import Image from "next/image";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
        <h1 className="text-xl font-bold text-gold">BookBurr</h1>
        <Link href="/profile">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "Avatar"}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center">
              <span className="text-xs font-bold text-gold">
                {(session?.user?.name ?? session?.user?.email ?? "U")[0].toUpperCase()}
              </span>
            </div>
          )}
        </Link>
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
