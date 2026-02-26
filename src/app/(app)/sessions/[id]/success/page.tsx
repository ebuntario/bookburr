import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSessionById } from "@/lib/queries/sessions";
import { SharePanel } from "./_components/share-panel";

interface SuccessPageProps {
  params: Promise<{ id: string }>;
}

export default async function SuccessPage({ params }: SuccessPageProps) {
  const [session, { id: sessionId }] = await Promise.all([
    auth(),
    params,
  ]);

  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const bukber = await getSessionById(sessionId);
  if (!bukber || bukber.hostId !== userId) redirect("/home");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://bookburr.com";
  const shareUrl = `${baseUrl}/sessions/${bukber.id}/join`;

  return (
    <SharePanel
      sessionName={bukber.name}
      inviteCode={bukber.inviteCode}
      shareUrl={shareUrl}
      sessionId={bukber.id}
    />
  );
}
