import nodemailer from "nodemailer";
import { z } from "zod";
import type { Lead } from "./lead-schema";
import { PRODUCT_LABELS } from "./lead-schema";

export const requiredEnv = [
  "PRIVACY_CONTACT_EMAIL", "GMAIL_USER", "GMAIL_APP_PASSWORD", "LEAD_EMAIL_TO",
  "GOOGLE_SHEETS_WEBHOOK_URL", "GOOGLE_SHEETS_WEBHOOK_SECRET", "WHATSAPP_RECIPIENT",
] as const;

export function missingConfiguration(): string[] {
  const invalid: string[] = requiredEnv.filter((key) => !process.env[key]?.trim());
  const email = z.email();
  if (!email.safeParse(process.env.GMAIL_USER?.trim()).success) invalid.push("GMAIL_USER");
  const recipients = process.env.LEAD_EMAIL_TO?.split(",").map((s) => s.trim()) || [];
  if (!recipients.length || recipients.some((s) => !email.safeParse(s).success)) invalid.push("LEAD_EMAIL_TO");
  if (!/^[a-zA-Z0-9]{16}$/.test((process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, ""))) invalid.push("GMAIL_APP_PASSWORD");
  if (!/^[1-9]\d{7,14}$/.test(process.env.WHATSAPP_RECIPIENT?.trim() || "")) invalid.push("WHATSAPP_RECIPIENT");
  if ((process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim().length || 0) < 32) invalid.push("GOOGLE_SHEETS_WEBHOOK_SECRET");
  try {
    const url = new URL(process.env.GOOGLE_SHEETS_WEBHOOK_URL || "");
    if (url.origin !== "https://script.google.com" || !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname) || url.search || url.hash || url.username || url.password) throw new Error();
  } catch { invalid.push("GOOGLE_SHEETS_WEBHOOK_URL"); }
  return [...new Set(invalid)];
}

const singleLine = (value: string) => value.replace(/[\r\n\t]+/g, " ");
const rupees = (n: number) => `INR ${n.toLocaleString("en-IN")}`;
export function leadLines(lead: Lead): string[][] {
  return [
    ["Reference", lead.id], ["Submitted (UTC)", lead.submittedAt],
    ["Name", lead.fullName], ["Phone", `+91${lead.phone}`], ["Email", lead.email],
    ["City", lead.city], ["PIN code", lead.pincode], ["Employer", lead.employer],
    ["Interested in", PRODUCT_LABELS[lead.productInterest]],
    ["Monthly salary", rupees(lead.salary)], ["Loan amount / credit limit required", rupees(lead.loanAmount)],
    ["Salary bank", lead.salaryBank], ["Contact consent", "Yes"], ["Consent version", lead.consentVersion],
  ].map(([label, value]) => [label, singleLine(value)]);
}

export function buildWhatsAppUrl(lead: Lead) {
  const recipient = process.env.WHATSAPP_RECIPIENT?.trim() || "";
  if (!/^[1-9]\d{7,14}$/.test(recipient)) throw new Error("Invalid WhatsApp recipient");
  const message = "Hello LoanMitra India, I’d like to discuss my financing options.\n\n" +
    leadLines(lead).map(([label, value]) => `${label}: ${value}`).join("\n");
  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
}

export async function sendEmail(lead: Lead) {
  const user = process.env.GMAIL_USER!.trim();
  const recipients = process.env.LEAD_EMAIL_TO!.split(",").map((email) => email.trim());
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 465, secure: true,
    auth: { user, pass: process.env.GMAIL_APP_PASSWORD!.replace(/\s/g, "") },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    logger: false, debug: false,
  });
  try {
    const result = await transporter.sendMail({
      from: { name: "LoanMitra India", address: user }, to: recipients,
      subject: `New salaried loan enquiry • ${lead.id}`,
      text: leadLines(lead).map(([label, value]) => `${label}: ${value}`).join("\n"),
      disableFileAccess: true, disableUrlAccess: true,
    });
    if (!result.accepted?.length || result.rejected?.length) throw new Error("SMTP recipients not all accepted");
  } finally { transporter.close(); }
}

export async function appendSheet(lead: Lead) {
  const { website: _honeypot, ...data } = lead;
  const signal = AbortSignal.timeout(20000);
  const response = await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL!.trim(), {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: process.env.GOOGLE_SHEETS_WEBHOOK_SECRET!.trim(), lead: data }),
    // Follow Google's result redirect with GET; never forward the secret body.
    redirect: "manual", signal,
  });
  let result = response;
  if (response.status === 302 || response.status === 303) {
    const location = new URL(response.headers.get("location") || "");
    if (location.origin !== "https://script.googleusercontent.com" || location.username || location.password) throw new Error("Unexpected webhook redirect");
    result = await fetch(location.toString(), { method: "GET", redirect: "error", signal });
  }
  if (!result.ok) throw new Error("Sheets webhook failed");
  const ack = await result.json();
  if (ack?.ok !== true || ack.reference !== lead.id) throw new Error("Sheets webhook did not confirm receipt");
}

export async function deliverLead(lead: Lead) {
  const channels = ["email", "sheets"] as const;
  const results = await Promise.allSettled([sendEmail(lead), appendSheet(lead)]);
  return channels.map((channel, i) => ({ channel, sent: results[i].status === "fulfilled" }));
}
