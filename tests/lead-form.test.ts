import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { createElement } from "react";
import { JSDOM } from "jsdom";
import LeadForm from "../src/components/lead-form";
import { safeWhatsAppUrl, whatsappNavigation } from "../src/lib/whatsapp-navigation";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost:3000" });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, FormData: dom.window.FormData, IS_REACT_ACT_ENVIRONMENT: true });
// Import after installing the DOM so React's event support is initialized correctly.
const { render, fireEvent, waitFor, cleanup } = require("@testing-library/react") as typeof import("@testing-library/react");
const whatsappUrl = "https://wa.me/919999999999?text=Hello%20there";

afterEach(() => { cleanup(); mock.restoreAll(); });
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
    const opened: string[] = [];
    mock.method(whatsappNavigation, "open", (url: string) => { opened.push(url); });
    mock.method(globalThis, "fetch", async () => Response.json({ ok: true, reference: "test-reference", status, whatsappUrl }));
    const ui = completeForm();
    fireEvent.submit(ui.container.querySelector("form")!);
    await waitFor(() => assert.equal(opened.length, 1));
    assert.equal(opened[0], whatsappUrl);
    assert.equal(ui.getByRole("link", { name: /Open WhatsApp/ }).getAttribute("href"), whatsappUrl);
    assert.ok(ui.getByText(/Your WhatsApp message has not been sent automatically/));
    cleanup(); mock.restoreAll();
  }
});
test("total failure retains values and offers a manual link without navigation", async () => {
  const open = mock.method(whatsappNavigation, "open", () => {});
  mock.method(globalThis, "fetch", async () => Response.json({ error: "Delivery could not be confirmed.", whatsappUrl }, { status: 502 }));
  const ui = completeForm(); fireEvent.submit(ui.container.querySelector("form")!);
  await waitFor(() => assert.ok(ui.getByRole("alert")));
  assert.equal(open.mock.callCount(), 0);
  assert.equal((ui.getByLabelText(/Full name/) as HTMLInputElement).value, "Test Applicant");
  assert.ok(ui.getByRole("link", { name: /Open WhatsApp/ }));
});
test("blocked navigation keeps the confirmation and manual link", async () => {
  mock.method(whatsappNavigation, "open", () => { throw new Error("blocked"); });
  mock.method(globalThis, "fetch", async () => Response.json({ ok: true, reference: "reference", whatsappUrl }));
  const ui = completeForm(); fireEvent.submit(ui.container.querySelector("form")!);
  await waitFor(() => assert.ok(ui.getByText("ENQUIRY RECEIVED")));
  assert.ok(ui.getByRole("link", { name: /Open WhatsApp/ }));
});
test("validation prevents submission and navigation", async () => {
  const network = mock.method(globalThis, "fetch", async () => Response.json({}));
  const open = mock.method(whatsappNavigation, "open", () => {});
  const ui = completeForm();
  fireEvent.change(ui.getByLabelText(/Monthly take-home salary/), { target: { value: "17999" } });
  fireEvent.submit(ui.container.querySelector("form")!);
  await waitFor(() => assert.ok(ui.getByText(/minimum monthly salary/)));
  assert.equal(network.mock.callCount(), 0); assert.equal(open.mock.callCount(), 0);
});
test("untrusted URLs cannot become WhatsApp navigation targets", () => {
  for (const url of ["javascript:alert(1)", "https://wa.me.evil.example/919999999999?text=hi", "https://user@wa.me/919999999999?text=hi", "https://wa.me/+919999999999?text=hi"]) assert.equal(safeWhatsAppUrl(url), "");
  assert.equal(safeWhatsAppUrl(whatsappUrl), whatsappUrl);
});
