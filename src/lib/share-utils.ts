export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function buildWhatsAppShareUrl(
  sessionName: string,
  shareUrl: string,
  inviteCode: string,
): string {
  const text = `Yuk bukber bareng! Join "${sessionName}" di BookBurr 🌙\n\nKlik link: ${shareUrl}\n\nAtau pake kode: ${inviteCode}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
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
