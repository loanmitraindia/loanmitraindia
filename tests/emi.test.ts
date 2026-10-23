import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { toast } from "sonner";
import { calculateEmi, formatRupees, formatTenure, parseLoanAmount, parseTenure, parseInterestRate } from "../src/lib/emi";
import EmiCalculator from "../src/components/emi-calculator";
import LoanJourney from "../src/components/loan-journey";
import { whatsappNavigation } from "../src/lib/whatsapp-navigation";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost:3000" });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, FormData: dom.window.FormData, IS_REACT_ACT_ENVIRONMENT: true });
const { render, fireEvent, waitFor, cleanup, act } = require("@testing-library/react") as typeof import("@testing-library/react");
beforeEach(() => { mock.method(toast, "dismiss", () => "notification"); mock.method(toast, "error", () => "notification"); });
afterEach(() => { cleanup(); mock.restoreAll(); });

test("EMI formula and display use unrounded repayments with Indian currency grouping", () => {
  const result = calculateEmi(300000, 36);
  assert.ok(Math.abs(result.emi - 9666.077443660757) < 0.000001);
  assert.equal(result.total, result.emi * 36);
  assert.equal(result.interest, result.total - 300000);
  assert.equal(formatRupees(result.emi), "₹9,666");
  assert.equal(formatRupees(result.interest), "₹47,979");
  assert.equal(formatRupees(result.total), "₹3,47,979");
  for (const amount of [50000, 4000000]) for (const months of [12, 60]) {
    const value = calculateEmi(amount, months);
    assert.ok(Number.isFinite(value.emi) && value.total > amount && value.interest > 0);
  }
  assert.ok(calculateEmi(300000, 60).emi < result.emi);
  assert.ok(calculateEmi(300000, 60).interest > result.interest);
  assert.throws(() => calculateEmi(NaN, 36), RangeError);
  assert.throws(() => calculateEmi(49999, 36), RangeError);
  assert.throws(() => calculateEmi(300000, 61), RangeError);
});

test("calculator parses valid whole values and rejects invalid input without clamping", () => {
  for (const text of ["", "0", "0.99", "36.01", "9.999", "abc", "1e1", "9.", "Infinity"]) assert.equal(parseInterestRate(text), null);
  for (const rate of [1, 9.9, 12.25, 36]) {
    assert.equal(parseInterestRate(String(rate)), rate);
    const result = calculateEmi(300000, 36, rate);
    const r = rate / 1200;
    assert.ok(Math.abs(result.emi * (1 - (1 + r) ** -36) / r - 300000) < 0.00001);
  }
  for (const rate of [NaN, Infinity, 0, 36.1]) assert.throws(() => calculateEmi(300000, 36, rate), RangeError);
  for (const text of ["300001", "3,00,001", "300,001"]) assert.equal(parseLoanAmount(text), 300001);
  assert.equal(parseLoanAmount("40,00,000"), 4000000);
  assert.equal(parseLoanAmount("50,000"), 50000);
  for (const text of ["", " ", "3,,00,000", "abc", "3e5", "-300000", "49999", "4000001", "300000.5"]) assert.equal(parseLoanAmount(text), null);
  for (const text of ["", "0", "11", "61", "36.5", "abc"]) assert.equal(parseTenure(text), null);
  assert.equal(parseTenure("12"), 12); assert.equal(parseTenure("60"), 60);
  assert.equal(formatTenure(37), "3 years 1 month");
});

test("default EMI estimate is server-rendered with no-JavaScript explanation", () => {
  const html = renderToStaticMarkup(createElement(EmiCalculator, { status: "idle", onEnquire: () => {} }));
  const doc = new JSDOM(html).window.document;
  assert.match(doc.body.textContent!, /₹9,666/);
  assert.match(doc.querySelector("noscript")!.textContent!, /Enable JavaScript/);
  assert.equal(doc.querySelectorAll("input").length, 6);
});

test("calculator inputs and sliders update results, with inline errors and debounced announcements", async () => {
  const amounts: number[] = [];
  const ui = render(createElement(EmiCalculator, { status: "idle", onEnquire: amount => amounts.push(amount) }));
  const amount = ui.getByLabelText("Loan amount") as HTMLInputElement;
  const tenure = ui.getByLabelText("Repayment tenure") as HTMLInputElement;
  const amountSlider = ui.getByRole("slider", { name: "Loan amount slider" }) as HTMLInputElement;
  const rateField = ui.getByLabelText("Annual interest rate (%)") as HTMLInputElement;
  const rateSlider = ui.getByRole("slider", { name: "Annual interest rate slider" }) as HTMLInputElement;
  assert.equal(rateSlider.step, "0.1");
  fireEvent.change(rateField, { target: { value: "12.25" } });
  // The native slider uses a 0.1 grid; precise typed values stay in the field/results.
  assert.equal(rateSlider.getAttribute("aria-valuetext"), "12.25% per year");
  assert.match(ui.getByTestId("emi-value").textContent!, new RegExp(formatRupees(calculateEmi(300000, 36, 12.25).emi)));
  for (const value of ["", "0.99", "36.01", "9.999", "abc"]) {
    fireEvent.change(rateField, { target: { value } });
    assert.equal(rateField.value, value);
    assert.equal(rateField.getAttribute("aria-invalid"), "true");
    assert.match(ui.getByTestId("emi-value").textContent!, /—/);
    assert.equal(ui.getByRole("button").hasAttribute("disabled"), true);
  }
  fireEvent.change(rateSlider, { target: { value: "9.9" } });
  assert.equal(rateField.value, "9.9");
  assert.equal(amountSlider.step, "10000");
  fireEvent.change(amount, { target: { value: "3,00,001" } });
  fireEvent.click(ui.getByRole("button", { name: "Enquire for this amount" }));
  assert.deepEqual(amounts, [300001]);
  fireEvent.change(amountSlider, { target: { value: "500000" } });
  assert.equal(amount.value, "5,00,000");
  fireEvent.change(ui.getByRole("slider", { name: "Repayment tenure slider" }), { target: { value: "37" } });
  assert.equal(tenure.value, "37");
  assert.ok(ui.getByText("3 years 1 month"));
  fireEvent.change(tenure, { target: { value: "60" } });
  assert.equal((ui.getByRole("slider", { name: "Repayment tenure slider" }) as HTMLInputElement).value, "60");
  assert.match(ui.getByTestId("emi-value").textContent!, new RegExp(formatRupees(calculateEmi(500000, 60).emi)));
  await waitFor(() => assert.match(ui.getByRole("status").textContent!, /Total repayment/));
  for (const value of ["", "49999", "4000001", "abc", "1.5"]) {
    fireEvent.change(amount, { target: { value } });
    assert.equal(amount.value, value);
    assert.equal(amount.getAttribute("aria-invalid"), "true");
    assert.match(ui.getByTestId("emi-value").textContent!, /—/);
    assert.equal(ui.getByRole("button").hasAttribute("disabled"), true);
  }
  fireEvent.change(amount, { target: { value: "50000" } }); fireEvent.blur(amount);
  assert.equal(amount.value, "50,000");
  fireEvent.change(tenure, { target: { value: "11" } });
  assert.equal(tenure.getAttribute("aria-invalid"), "true");
  assert.equal(ui.getByRole("button").hasAttribute("disabled"), true);
  fireEvent.change(tenure, { target: { value: "12" } });
  assert.equal(ui.getByRole("button").hasAttribute("disabled"), false);
});

test("handoff copies only on click, preserves other fields and accepts repeated same-amount requests", () => {
  const ui = render(createElement(LoanJourney, { intro: "Introduction", steps: "Supporting information" }));
  const loan = ui.getByLabelText(/Loan amount \/ credit limit required/) as HTMLInputElement;
  const name = ui.getByLabelText(/Full name/) as HTMLInputElement;
  const amount = ui.getByLabelText("Loan amount");
  assert.equal(loan.value, "");
  fireEvent.change(name, { target: { value: "Existing Applicant" } });
  fireEvent.change(ui.getByLabelText(/Interested in/), { target: { value: "overdraft" } });
  fireEvent.click(ui.getByRole("button", { name: "Enquire for this amount" }));
  assert.equal(loan.value, "3,00,000"); assert.equal(document.activeElement, loan);
  assert.equal(name.value, "Existing Applicant");
  assert.equal((ui.getByLabelText(/Interested in/) as HTMLSelectElement).value, "overdraft");
  fireEvent.change(loan, { target: { value: "425000" } });
  fireEvent.change(amount, { target: { value: "500000" } });
  assert.equal(loan.value, "425000");
  fireEvent.click(ui.getByRole("button", { name: "Enquire for this amount" }));
  assert.equal(loan.value, "5,00,000");
  fireEvent.change(loan, { target: { value: "600000" } });
  fireEvent.click(ui.getByRole("button", { name: "Enquire for this amount" }));
  assert.equal(loan.value, "5,00,000");
});

test("handoff locks during submission and becomes a confirmation link after receipt without extending the API", async () => {
  let resolve!: (response: Response) => void;
  let payload: Record<string, unknown> = {};
  mock.method(globalThis, "fetch", async (_: unknown, init?: RequestInit) => { payload = JSON.parse(String(init?.body)); return new Promise<Response>(done => { resolve = done; }); });
  mock.method(whatsappNavigation, "open", () => {});
  const ui = render(createElement(LoanJourney, { intro: "Introduction", steps: "Supporting" }));
  fireEvent.click(ui.getByRole("button", { name: "Enquire for this amount" }));
  for (const [name, value] of Object.entries({ fullName: "Test Applicant", phone: "9876543210", email: "test@example.com", city: "Pune", pincode: "411001", employer: "Example Company", salary: "18000" })) fireEvent.change(ui.container.querySelector(`[name="${name}"]`)!, { target: { value } });
  fireEvent.change(ui.getByLabelText(/Interested in/), { target: { value: "personal_loan" } });
  fireEvent.change(ui.getByLabelText(/Salary account bank/), { target: { value: "HDFC Bank" } });
  fireEvent.click(ui.getByRole("checkbox"));
  fireEvent.submit(ui.container.querySelector("form")!);
  await waitFor(() => assert.ok(ui.getByRole("button", { name: "Enquiry in progress…" }).hasAttribute("disabled")));
  assert.equal(payload.loanAmount, 300000);
  for (const key of ["tenure", "months", "rate", "emi"]) assert.equal(key in payload, false);
  await act(async () => resolve(Response.json({ ok: true, reference: "emi-test", whatsappUrl: "https://wa.me/919999999999?text=test" })));
  const confirmation = await ui.findByRole("link", { name: "View your enquiry confirmation" });
  assert.equal(confirmation.getAttribute("href"), "#apply");
  fireEvent.change(ui.getByLabelText("Loan amount"), { target: { value: "800000" } });
  fireEvent.click(confirmation);
  assert.ok(ui.getByText("ENQUIRY RECEIVED"));
  assert.equal(ui.queryByLabelText(/Loan amount \/ credit limit required/), null);
  fireEvent.click(ui.getByRole("button", { name: "Back to the form" }));
  assert.equal((ui.getByLabelText(/Loan amount \/ credit limit required/) as HTMLInputElement).value, "", "old handoff must not replay after confirmation reset");
});
