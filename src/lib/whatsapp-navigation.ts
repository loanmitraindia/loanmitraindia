// Shared by the success and failure UI. Reject unexpected API URLs before navigation.
export function safeWhatsAppUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    return url.origin === "https://wa.me" && /^\/[1-9]\d{7,14}$/.test(url.pathname)
      && !url.username && !url.password && !url.hash && url.searchParams.has("text") ? url.toString() : "";
  } catch { return ""; }
}

export const whatsappNavigation = {
  open(url: string) {
    const safe = safeWhatsAppUrl(url);
    if (safe) window.location.assign(safe);
  },
};
