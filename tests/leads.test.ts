import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type Mail from "nodemailer/lib/mailer";
import { POST } from "../src/app/api/leads/route";
import { appendSheet, buildWhatsAppUrl, missingConfiguration, requiredEnv } from "../src/lib/delivery";
import { CONSENT_VERSION, leadSchema, PRODUCT_LABELS } from "../src/lib/lead-schema";

const valid = { fullName: "Test Applicant", phone: "9876543210", email: "applicant@example.com", city: "Pune", pincode: "411001", employer: "Example Company", salary: 18000, loanAmount: 300000, salaryBank: "Example Bank", consent: true as const, website: "" };
const lead = { ...valid, productInterest: "personal_loan" as const, id: "d7334c43-1435-4e59-9f5b-74a0f47bde20", submittedAt: "2026-10-22T10:00:00.000Z", consentVersion: CONSENT_VERSION, leadSchema, PRODUCT_LABELS };
const oldEnv = { ...process.env };

test("product interest validates all choices and keeps legacy requests compatible", async () => {
  assert.equal(leadSchema.parse(valid).productInterest, "personal_loan");
  for (const productInterest of ["", "unknown", null, 1]) assert.equal(leadSchema.safeParse({ ...valid, productInterest }).success, false);
  let index = 0;
  for (const [productInterest, label] of Object.entries(PRODUCT_LABELS)) {
    const response = await POST(request({ ...valid, phone: `987654320${index++}`, productInterest }));
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.ok(String(mail.at(-1)!.text).includes(`Interested in: ${label}`));
    assert.equal(JSON.parse(String(calls.at(-1)!.init.body)).lead.productInterest, productInterest);
    assert.ok(new URL(result.whatsappUrl).searchParams.get("text")!.includes(`Interested in: ${label}`));
  }
});
let calls: Array<{ url: string; init: RequestInit }>;
let mail: Mail.Options[];
let smtpOptions: SMTPTransport.Options;
let smtpFailure: boolean;
let closed: number;

beforeEach(() => {
  for (const name of requiredEnv) process.env[name] = "test-value";
  Object.assign(process.env, { SITE_URL: "http://localhost:3000", TRUST_PROXY: "false", GMAIL_USER: "sender@gmail.com", GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop", LEAD_EMAIL_TO: "team@example.com", WHATSAPP_RECIPIENT: "919999999999", GOOGLE_SHEETS_WEBHOOK_URL: "https://script.google.com/macros/s/test-deployment/exec", GOOGLE_SHEETS_WEBHOOK_SECRET: "a".repeat(48) });
  calls = []; mail = []; smtpFailure = false; closed = 0;
  mock.method(console, "error", () => {});
  mock.method(nodemailer, "createTransport", (options: SMTPTransport.Options) => {
    smtpOptions = options;
    return {
      sendMail: async (message: Mail.Options) => { mail.push(message); if (smtpFailure) throw new Error("secret SMTP failure"); return { accepted: ["team@example.com"], rejected: [] }; },
      close: () => { closed++; },
    } as unknown as ReturnType<typeof nodemailer.createTransport>;
  });
  mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), init });
    const payload = JSON.parse(String(init.body));
    return Response.json({ ok: true, reference: payload.lead.id });
  });
});
afterEach(() => {
  mock.restoreAll();
  for (const key of Object.keys(process.env)) if (!(key in oldEnv)) delete process.env[key];
  Object.assign(process.env, oldEnv);
});
function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/leads", { method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost:3000", ...headers }, body: JSON.stringify(body) });
}

test("valid boundary salary sends Gmail and webhook and returns an unsent WhatsApp link", async () => {
  const response = await POST(request(valid));
  const result = await response.json();
  assert.equal(response.status, 200); assert.equal(result.status, "delivered");
  assert.equal(calls.length, 1); assert.equal(mail.length, 1); assert.equal(closed, 1);
  assert.equal(smtpOptions.host, "smtp.gmail.com"); assert.equal(smtpOptions.port, 465); assert.equal(smtpOptions.secure, true);
  assert.deepEqual(smtpOptions.auth, { user: "sender@gmail.com", pass: "abcdefghijklmnop" });
  assert.deepEqual(mail[0].from, { name: "LoanMitra India", address: "sender@gmail.com" });
  assert.deepEqual(mail[0].to, ["team@example.com"]); assert.match(String(mail[0].text), /INR 3,00,000/);
  const payload = JSON.parse(String(calls[0].init.body));
  assert.equal(payload.secret, process.env.GOOGLE_SHEETS_WEBHOOK_SECRET);
  assert.equal(payload.lead.id, result.reference); assert.equal(payload.lead.website, undefined);
  const url = new URL(result.whatsappUrl);
  assert.equal(url.origin, "https://wa.me"); assert.equal(url.pathname, "/919999999999");
  assert.match(url.searchParams.get("text")!, /Phone: \+919876543210/);
  assert.ok(!JSON.stringify(result).includes(process.env.GOOGLE_SHEETS_WEBHOOK_SECRET!));
});
test("rejects invalid salary, phone, PIN, consent and honeypot without delivery", async () => {
  for (const invalid of [{ salary: 17999 }, { phone: "1234567890" }, { pincode: "000000" }, { consent: false }, { website: "spam" }]) assert.equal((await POST(request({ ...valid, ...invalid }))).status, 400);
  assert.equal(calls.length + mail.length, 0);
});
test("missing or invalid configuration fails closed", async () => {
  assert.deepEqual(missingConfiguration(), []);
  delete process.env.GMAIL_APP_PASSWORD;
  assert.equal((await POST(request(valid))).status, 503);
  assert.equal(calls.length + mail.length, 0);
  process.env.GMAIL_APP_PASSWORD = "abcdefghijklmnop";
  for (const number of ["+919999999999", "91999 9999999", "00000000", "919999999999?text=bad"]) { process.env.WHATSAPP_RECIPIENT = number; assert.ok(missingConfiguration().includes("WHATSAPP_RECIPIENT")); }
  process.env.GOOGLE_SHEETS_WEBHOOK_URL = "https://evil.example/exec";
  assert.ok(missingConfiguration().includes("GOOGLE_SHEETS_WEBHOOK_URL"));
});
test("rejects cross-origin, oversized, malformed and non-JSON requests", async () => {
  assert.equal((await POST(request(valid, { Origin: "https://other.example" }))).status, 403);
  assert.equal((await POST(request({ ...valid, fullName: "a".repeat(13000) }))).status, 413);
  assert.equal((await POST(new Request("http://localhost:3000/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }))).status, 400);
  assert.equal((await POST(request(valid, { "Content-Type": "text/plain" }))).status, 415);
  assert.equal(calls.length + mail.length, 0);
});
test("partial delivery succeeds with WhatsApp fallback regardless of which channel fails", async () => {
  smtpFailure = true;
  let response = await POST(request({ ...valid, phone: "9876543211" }));
  assert.equal((await response.json()).status, "partially_delivered"); assert.equal(response.status, 200); assert.equal(closed, 1);
  smtpFailure = false;
  mock.method(globalThis, "fetch", async () => Response.json({ ok: false, error: "unauthorized" }));
  response = await POST(request({ ...valid, phone: "9876543212" }));
  const body = await response.json();
  assert.equal(body.status, "partially_delivered"); assert.ok(body.whatsappUrl);
});
test("total failure returns a manual WhatsApp link without claiming receipt", async () => {
  smtpFailure = true;
  mock.method(globalThis, "fetch", async () => { throw new DOMException("secret failure", "TimeoutError"); });
  const response = await POST(request({ ...valid, phone: "9876543214" }));
  const body = await response.json();
  assert.equal(response.status, 502); assert.equal(body.ok, undefined); assert.ok(body.whatsappUrl);
  assert.doesNotMatch(JSON.stringify(body), /secret/);
});
test("webhook rejects malformed, unsuccessful and mismatched acknowledgements", async () => {
  for (const body of ["<html>Sign in</html>", "null", '{"ok":false}', '{"ok":true,"reference":"wrong"}']) {
    mock.method(globalThis, "fetch", async () => new Response(body));
    await assert.rejects(appendSheet(lead));
  }
  mock.method(globalThis, "fetch", async () => new Response("error", { status: 500 }));
  await assert.rejects(appendSheet(lead));
  mock.method(globalThis, "fetch", async () => { throw new DOMException("timeout", "TimeoutError"); });
  await assert.rejects(appendSheet(lead));
});
test("Apps Script result redirect uses GET without forwarding credentials", async () => {
  mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), init });
    return calls.length === 1 ? new Response(null, { status: 302, headers: { Location: "https://script.googleusercontent.com/macros/echo?result=1" } }) : Response.json({ ok: true, reference: lead.id });
  });
  await appendSheet(lead);
  assert.equal(calls.length, 2); assert.equal(calls[1].init.method, "GET"); assert.equal(calls[1].init.body, undefined); assert.equal(calls[1].init.headers, undefined);
  mock.method(globalThis, "fetch", async () => new Response(null, { status: 302, headers: { Location: "https://evil.example" } }));
  await assert.rejects(appendSheet(lead), /Unexpected webhook redirect/);
});
test("WhatsApp message preserves Unicode and encodes query-breaking text", () => {
  const url = new URL(buildWhatsAppUrl({ ...lead, fullName: "अभिषेक & Co? #1", employer: "A\nInjected: bad" }));
  assert.equal([...url.searchParams.keys()].length, 1);
  assert.match(url.searchParams.get("text")!, /अभिषेक & Co\? #1/);
  assert.match(url.searchParams.get("text")!, /Employer: A Injected: bad/);
});
test("limits repeated submissions", async () => {
  for (let i = 0; i < 3; i++) assert.equal((await POST(request({ ...valid, phone: "9876543213" }))).status, 200);
  assert.equal((await POST(request({ ...valid, phone: "9876543213" }))).status, 429);
  assert.equal(mail.length, 3); assert.equal(calls.length, 3);
});
