import { NextResponse } from "next/server";
import { CONSENT_VERSION, leadSchema } from "@/lib/lead-schema";
import { buildWhatsAppUrl, deliverLead, missingConfiguration } from "@/lib/delivery";

export const runtime = "nodejs";
export const maxDuration = 60;

// Best-effort per-process throttling. Use a shared rate limiter when scaling.
const attempts = new Map<string, { count: number; expires: number }>();
const reply = (body: object, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const expectedOrigin = process.env.SITE_URL || new URL(request.url).origin;
  if (origin && origin !== expectedOrigin) return reply({ error: "This request could not be verified." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return reply({ error: "Expected a JSON request." }, 415);
  if (Number(request.headers.get("content-length") || 0) > 12000) return reply({ error: "Request is too large." }, 413);

  let raw: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: "Missing form data." }, 400);
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 12000) { await reader.cancel(); return reply({ error: "Request is too large." }, 413); }
      chunks.push(value);
    }
    raw = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch { return reply({ error: "Please check your form and try again." }, 400); }
  const result = leadSchema.safeParse(raw);
  if (!result.success) return reply({ error: result.error.issues[0].message }, 400);

  if (missingConfiguration().length) {
    return reply({ error: "Online enquiries are not available yet. Please try again later." }, 503);
  }

  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.expires <= now) attempts.delete(key);
  // Only trust proxy headers when deployment explicitly enables this.
  const key = process.env.TRUST_PROXY === "true" ? (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || result.data.phone) : result.data.phone;
  const entry = attempts.get(key) || { count: 0, expires: now + 600000 };
  if (entry.count >= 3 || attempts.size >= 10000) return reply({ error: "Too many enquiries. Please try again in 10 minutes." }, 429);
  entry.count += 1;
  attempts.set(key, entry);

  const id = crypto.randomUUID();
  const lead = { ...result.data, id, submittedAt: new Date().toISOString(), consentVersion: CONSENT_VERSION };
  const whatsappUrl = buildWhatsAppUrl(lead);
  const deliveries = await deliverLead(lead);
  const delivered = deliveries.filter((item) => item.sent).length;
  if (delivered < 2) console.error("Lead delivery incomplete", { id, channels: deliveries });
  if (!delivered) return reply({ error: "We couldn’t confirm your enquiry by email or Google Sheets. You can try again or send it through WhatsApp below.", reference: id, whatsappUrl }, 502);
  // Some channels may fail after others succeed. Avoid encouraging duplicate submissions.
  return reply({ ok: true, reference: id, status: delivered === 2 ? "delivered" : "partially_delivered", whatsappUrl }, 200);
}
