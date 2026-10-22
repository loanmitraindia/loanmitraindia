import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { createElement } from "react";
import { JSDOM } from "jsdom";
import { toast } from "sonner";
import LeadForm from "../src/components/lead-form";
import { safeWhatsAppUrl, whatsappNavigation } from "../src/lib/whatsapp-navigation";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost:3000" });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, FormData: dom.window.FormData, IS_REACT_ACT_ENVIRONMENT: true });
// Import after installing the DOM so React's event support is initialized correctly.
const { render, fireEvent, waitFor, cleanup } = require("@testing-library/react") as typeof import("@testing-library/react");
const whatsappUrl = "https://wa.me/919999999999?text=Hello%20there";

afterEach(() => { cleanup(); mock.restoreAll(); });
function notifications() {
  return { error: mock.method(toast, "error", () => "notification"), dismiss: mock.method(toast, "dismiss", () => "notification") };
}
function completeForm() {
  const ui = render(createElement(LeadForm));
  for (const [name, value] of Object.entries({ fullName: "Test Applicant", phone: "9876543210", email: "test@example.com", city: "Pune", pincode: "411001", employer: "Example Company", salary: "18,000", loanAmount: "3,00,000" })) {
    fireEvent.change(ui.container.querySelector(`[name="${name}"]`)!, { target: { value } });
  }
  fireEvent.change(ui.getByLabelText(/Salary account bank/), { target: { value: "HDFC Bank" } });
  fireEvent.click(ui.getByRole("checkbox"));
  return ui;
}

test("full and partial receipt automatically open WhatsApp with a manual fallback", async () => {
  for (const status of ["delivered", "partially_delivered"]) {
    const feedback = notifications();
    const opened: string[] = [];
    mock.method(whatsappNavigation, "open", (url: string) => { opened.push(url); });
    mock.method(globalThis, "fetch", async () => Response.json({ ok: true, reference: "test-reference", status, whatsappUrl }));
    const ui = completeForm();
    fireEvent.submit(ui.container.querySelector("form")!);
    await waitFor(() => assert.equal(opened.length, 1));
    assert.equal(opened[0], whatsappUrl);
    assert.equal(feedback.error.mock.callCount(), 0);
    assert.equal(ui.getByRole("link", { name: /Open WhatsApp/ }).getAttribute("href"), whatsappUrl);
    assert.ok(ui.getByText(/Your WhatsApp message has not been sent automatically/));
    cleanup(); mock.restoreAll();
  }
});
test("total failure retains values and offers a manual link without navigation", async () => {
  const feedback = notifications();
  const open = mock.method(whatsappNavigation, "open", () => {});
  mock.method(globalThis, "fetch", async () => Response.json({ error: "Delivery could not be confirmed.", whatsappUrl }, { status: 502 }));
  const ui = completeForm(); fireEvent.submit(ui.container.querySelector("form")!);
  await waitFor(() => assert.ok(ui.getByText("Delivery could not be confirmed.")));
  assert.equal(feedback.error.mock.callCount(), 1);
  assert.equal(ui.queryByRole("alert"), null, "the toaster is the only error live-announcement source");
  assert.equal(ui.container.querySelector("form")?.getAttribute("aria-describedby"), "delivery-error");
  assert.equal(open.mock.callCount(), 0);
  assert.equal((ui.getByLabelText(/Full name/) as HTMLInputElement).value, "Test Applicant");
  assert.ok(ui.getByRole("link", { name: /Open WhatsApp/ }));
});
test("blocked navigation keeps the confirmation and manual link", async () => {
  const feedback = notifications();
  mock.method(whatsappNavigation, "open", () => { throw new Error("blocked"); });
  mock.method(globalThis, "fetch", async () => Response.json({ ok: true, reference: "reference", whatsappUrl }));
  const ui = completeForm(); fireEvent.submit(ui.container.querySelector("form")!);
  await waitFor(() => assert.ok(ui.getByText("ENQUIRY RECEIVED")));
  assert.ok(ui.getByRole("link", { name: /Open WhatsApp/ }));
  await waitFor(() => assert.equal(feedback.error.mock.callCount(), 1));
  assert.equal(feedback.error.mock.calls[0].arguments[0], "WhatsApp could not open automatically.");
});
test("validation prevents submission and navigation", async () => {
  const feedback = notifications();
  const network = mock.method(globalThis, "fetch", async () => Response.json({}));
  const open = mock.method(whatsappNavigation, "open", () => {});
  const ui = completeForm();
  fireEvent.change(ui.getByLabelText(/Monthly take-home salary/), { target: { value: "17999" } });
  fireEvent.submit(ui.container.querySelector("form")!);
  await waitFor(() => assert.ok(ui.getByText(/minimum monthly salary/)));
  assert.equal(network.mock.callCount(), 0); assert.equal(open.mock.callCount(), 0);
  assert.equal(feedback.error.mock.callCount(), 0);
});

test("retries dismiss stale feedback and reuse the same toast id without applicant details", async () => {
  const feedback = notifications();
  mock.method(globalThis, "fetch", async () => Response.json({ error: "Service unavailable for test@example.com" }, { status: 503 }));
  const ui = completeForm();
  for (let i = 0; i < 2; i++) {
    fireEvent.submit(ui.container.querySelector("form")!);
    await waitFor(() => assert.equal(feedback.error.mock.callCount(), i + 1));
    await waitFor(() => assert.equal(ui.getByRole("button", { name: "Request a callback" }).hasAttribute("disabled"), false));
  }
  const calls = feedback.error.mock.calls;
  const id = calls[0].arguments[1]?.id;
  assert.ok(id);
  assert.equal(calls[1].arguments[1]?.id, id);
  assert.deepEqual(feedback.dismiss.mock.calls.map(call => call.arguments[0]), [id, id]);
  assert.doesNotMatch(JSON.stringify(calls.map(call => call.arguments)), /test@example.com|Test Applicant|9876543210/);
  assert.equal((ui.getByLabelText(/Full name/) as HTMLInputElement).value, "Test Applicant");
});

test("timeouts and network failures use a generic toast and preserve the form", async () => {
  for (const failure of [new DOMException("Timed out", "TimeoutError"), new TypeError("Failed to fetch")]) {
    const feedback = notifications();
    mock.method(globalThis, "fetch", async () => { throw failure; });
    const ui = completeForm();
    fireEvent.submit(ui.container.querySelector("form")!);
    await waitFor(() => assert.equal(feedback.error.mock.callCount(), 1));
    assert.ok(ui.getByText(/check your connection before trying again/));
    assert.equal((ui.getByLabelText(/Full name/) as HTMLInputElement).value, "Test Applicant");
    cleanup(); mock.restoreAll();
  }
});
test("untrusted URLs cannot become WhatsApp navigation targets", () => {
  for (const url of ["javascript:alert(1)", "https://wa.me.evil.example/919999999999?text=hi", "https://user@wa.me/919999999999?text=hi", "https://wa.me/+919999999999?text=hi"]) assert.equal(safeWhatsAppUrl(url), "");
  assert.equal(safeWhatsAppUrl(whatsappUrl), whatsappUrl);
});
