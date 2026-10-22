"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { calculateEmi, EMI_RATE, formatRupees, formatTenure, parseLoanAmount, parseTenure } from "@/lib/emi";

export type EnquiryStatus = "idle" | "submitting" | "received";

export default function EmiCalculator({ onEnquire, status }: { onEnquire: (amount: number) => void; status: EnquiryStatus }) {
  const [amountText, setAmountText] = useState("3,00,000");
  const [monthsText, setMonthsText] = useState("36");
  const [announcement, setAnnouncement] = useState("");
  const amount = parseLoanAmount(amountText), months = parseTenure(monthsText);
  const result = amount !== null && months !== null ? calculateEmi(amount, months) : null;
  const summary = result ? `Estimated monthly EMI ${formatRupees(result.emi)}. Total interest ${formatRupees(result.interest)}. Total repayment ${formatRupees(result.total)}.` : "Enter a valid loan amount and tenure to see your estimate.";
  useEffect(() => {
    const timer = window.setTimeout(() => setAnnouncement(summary), 450);
    return () => window.clearTimeout(timer);
  }, [summary]);
  const principalShare = result ? result.principal / result.total * 100 : 0;

  return <section className="emi-card" id="emi-calculator" aria-labelledby="emi-title">
    <div className="emi-inputs">
      <div className="emi-heading"><div><span className="eyebrow">ESTIMATE YOUR REPAYMENT</span><h2 id="emi-title">Personal loan EMI calculator</h2></div><span className="emi-rate">{EMI_RATE}% p.a.<small>Illustrative rate</small></span></div>
      <p className="emi-intro">Adjust the amount and tenure to estimate your monthly EMI at 9.9% p.a. No contact details needed.</p>
      <div className="emi-control">
        <div className="emi-field-row"><label htmlFor="emi-amount">Loan amount</label><div className="emi-number"><span aria-hidden="true">₹</span><input id="emi-amount" inputMode="numeric" maxLength={20} value={amountText} onChange={event => setAmountText(event.target.value)} onBlur={() => { if (amount !== null) setAmountText(amount.toLocaleString("en-IN")); }} aria-invalid={amount === null} aria-describedby={amount === null ? "emi-amount-error" : "emi-amount-bounds"} /></div></div>
        <input className="emi-slider" type="range" aria-label="Loan amount slider" min={50000} max={4000000} step={10000} value={amount ?? 50000} onChange={event => setAmountText(Number(event.target.value).toLocaleString("en-IN"))} aria-valuetext={formatRupees(amount ?? 50000)} />
        <div className="emi-bounds" id="emi-amount-bounds"><span>₹50,000</span><span>₹40,00,000</span></div>
        {amount === null && <p className="field-error" id="emi-amount-error">Enter a whole-rupee amount from ₹50,000 to ₹40,00,000.</p>}
      </div>
      <div className="emi-control">
        <div className="emi-field-row"><label htmlFor="emi-months">Repayment tenure</label><div className="emi-number emi-tenure-input"><input id="emi-months" inputMode="numeric" maxLength={4} value={monthsText} onChange={event => setMonthsText(event.target.value)} aria-invalid={months === null} aria-describedby={months === null ? "emi-months-error" : "emi-tenure-description"} /><span>months</span></div></div>
        <input className="emi-slider" type="range" aria-label="Repayment tenure slider" min={12} max={60} step={1} value={months ?? 12} onChange={event => setMonthsText(event.target.value)} aria-valuetext={months !== null ? formatTenure(months) : "12 months"} />
        <div className="emi-bounds"><span>1 year</span><span id="emi-tenure-description">{months !== null ? formatTenure(months) : "—"}</span><span>5 years</span></div>
        {months === null && <p className="field-error" id="emi-months-error">Enter a whole number of months from 12 to 60.</p>}
      </div>
    </div>
    <div className="emi-results">
      <div className="emi-result-top"><div><p className="emi-result-label">Estimated monthly EMI</p><p className="emi-value" data-testid="emi-value">{result ? formatRupees(result.emi) : "—"}<span>/ month</span></p></div>
        <svg className="emi-chart" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="39" fill="none" stroke="#f2a15b" strokeWidth="10" /><circle cx="50" cy="50" r="39" fill="none" stroke="#b9d2c1" strokeWidth="10" pathLength="100" strokeDasharray={`${principalShare} 100`} transform="rotate(-90 50 50)" /><text x="50" y="54" textAnchor="middle" fill="currentColor" fontSize="22">₹</text></svg>
      </div>
      <dl className="emi-breakdown"><div><dt><span className="emi-key emi-principal" />Principal</dt><dd>{result ? formatRupees(result.principal) : "—"}</dd></div><div><dt><span className="emi-key emi-interest" />Total interest</dt><dd>{result ? formatRupees(result.interest) : "—"}</dd></div><div className="emi-total"><dt>Total repayment</dt><dd>{result ? formatRupees(result.total) : "—"}</dd></div></dl>
      {status === "received" ? <a className="emi-cta" href="#apply">View your enquiry confirmation <ArrowRight size={18} aria-hidden="true" /></a> : <button className="emi-cta" type="button" disabled={!result || status === "submitting"} onClick={() => { if (amount !== null && result) onEnquire(amount); }}>{status === "submitting" ? "Enquiry in progress…" : "Enquire for this amount"}<ArrowRight size={18} aria-hidden="true" /></button>}
      {status !== "received" && <p className="emi-handoff-note">Copies this amount into the enquiry form. Nothing is submitted yet.</p>}
    </div>
    <p className="emi-disclaimer">Illustrative estimate at 9.9% p.a. on a reducing balance. Excludes processing fees, taxes and other charges. Actual rate, EMI, tenure and approval depend on the lender and your profile. Calculator ranges are illustrative, not eligibility limits. Figures are rounded to the nearest rupee.</p>
    <noscript><p className="emi-disclaimer">This is an example for ₹3,00,000 over 36 months. Enable JavaScript to change the estimate.</p></noscript>
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
  </section>;
}
