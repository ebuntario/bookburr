export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function nativeShare(
  sessionName: string,
  shareUrl: string,
): Promise<void> {
  if (!navigator.share) return;
  try {
    await navigator.share({
      title: `Bukber: ${sessionName}`,
      text: `Yuk join bukber "${sessionName}" di BookBurr!`,
      url: shareUrl,
    });
  } catch {
    // user cancelled — ignore
  }
}

function toWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildInvitationCard(input: {
  hostName?: string;
  sessionName: string;
  dateRange?: string;
  shareUrl: string;
  inviteCode: string;
}): string {
  const host = input.hostName || "Someone";
  const dateLine = input.dateRange ? ` — ${input.dateRange}` : "";
  const text = [
    `\u{1F319} ${host} ngajak lu bukber!`,
    `"${input.sessionName}"${dateLine}`,
    "",
    "Klik link ini buat join & vote tempat:",
    input.shareUrl,
    "",
    `Atau pake kode: ${input.inviteCode}`,
  ].join("\n");
  return toWhatsAppUrl(text);
}

export function buildVotingOpenCard(input: {
  sessionName: string;
  venueCount: number;
  shareUrl: string;
}): string {
  const text = [
    `\u{1F5F3}\u{FE0F} Voting udah dibuka buat "${input.sessionName}"!`,
    `Ada ${input.venueCount} pilihan tempat.`,
    "",
    `Vote sekarang: ${input.shareUrl}`,
  ].join("\n");
  return toWhatsAppUrl(text);
}

export function buildConfirmationCard(input: {
  sessionName: string;
  venueName: string;
  dateStr: string;
  time?: string;
  googleMapsUrl?: string;
}): string {
  const lines = [
    `\u{1F389} Bukber "${input.sessionName}" udah fix!`,
    `\u{1F4CD} ${input.venueName}`,
    `\u{1F4C5} ${input.dateStr}`,
    `\u{23F0} ${input.time ?? "18:00 WIB"}`,
  ];
  if (input.googleMapsUrl) {
    lines.push(`\u{1F4CD} ${input.googleMapsUrl}`);
  }
  lines.push("", "See you there bestie!");
  return toWhatsAppUrl(lines.join("\n"));
}
