"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, CheckCircle2, ChevronDown, LoaderCircle, LockKeyhole, RotateCcw } from "lucide-react";
import { leadSchema } from "@/lib/lead-schema";
import { safeWhatsAppUrl, whatsappNavigation } from "@/lib/whatsapp-navigation";

const fields = [
  { name: "fullName", label: "Full name", placeholder: "As on your official documents", autoComplete: "name", wide: true },
  { name: "phone", label: "Mobile number", placeholder: "10-digit mobile number", type: "tel", autoComplete: "tel-national", prefix: "+91", maxLength: 10, inputMode: "numeric" as const },
  { name: "email", label: "Email address", placeholder: "you@example.com", type: "email", autoComplete: "email" },
  { name: "city", label: "City", placeholder: "Your current city", autoComplete: "address-level2" },
  { name: "pincode", label: "PIN code", placeholder: "6-digit PIN code", autoComplete: "postal-code", maxLength: 6, inputMode: "numeric" as const },
  { name: "employer", label: "Company / employer", placeholder: "Where you work", autoComplete: "organization", wide: true },
  { name: "salary", label: "Monthly take-home salary", placeholder: "Minimum 18,000", prefix: "₹", inputMode: "numeric" as const },
  { name: "loanAmount", label: "Loan amount required", placeholder: "e.g. 3,00,000", prefix: "₹", inputMode: "numeric" as const },
];

export default function LeadForm() {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const redirectedReference = useRef("");
  const [bank, setBank] = useState("");
  const sending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!reference || !whatsappUrl || redirectedReference.current === reference) return;
    redirectedReference.current = reference;
    // Commit the confirmation view before leaving; the link remains as a fallback.
    try { whatsappNavigation.open(whatsappUrl); } catch { /* The manual link remains available. */ }
  }, [reference, whatsappUrl]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    setError(""); setErrors({}); setWhatsappUrl("");
    const data = new FormData(event.currentTarget);
    const parsed = leadSchema.safeParse({
      ...Object.fromEntries(data),
      salaryBank: bank === "Other" ? data.get("otherBank") : bank,
      salary: Number(String(data.get("salary") || "").replace(/,/g, "")),
      loanAmount: Number(String(data.get("loanAmount") || "").replace(/,/g, "")),
      consent: data.get("consent") === "on",
    });
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) nextErrors[String(issue.path[0])] ??= issue.message;
      setErrors(nextErrors);
      const first = String(parsed.error.issues[0].path[0]);
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data), signal: AbortSignal.timeout(60000) });
      const result = await response.json();
      setWhatsappUrl(safeWhatsAppUrl(result.whatsappUrl));
      if (!response.ok) throw new Error(result.error || "We couldn’t send your enquiry. Please try again.");
      setReference(result.reference);
    } catch (err) {
      setError(err instanceof Error && err.name !== "TimeoutError" && err.name !== "TypeError" ? err.message : "We couldn’t confirm receipt. Please check your connection before trying again.");
    } finally { setBusy(false); sending.current = false; }
  }

  if (reference) return <section className="application-card success-card" id="apply" aria-live="polite">
    <div className="success-icon"><CheckCircle2 size={38} /></div>
    <span className="eyebrow">ENQUIRY RECEIVED</span>
    <h2>You’ve taken the<br />first step.</h2>
    <p>Your details have been sent to the team. They can contact you to discuss the options available for your profile.</p>
    <div className="reference"><span>Your enquiry reference</span><code>{reference}</code></div>
    <p>WhatsApp will open with your enquiry details. Review the message and tap <strong>Send</strong> in WhatsApp to share it with the team.</p>
    {whatsappUrl && <a className="submit-button" href={whatsappUrl} rel="noreferrer">Open WhatsApp <ArrowRight size={19} /></a>}
    <p className="small-text">Your WhatsApp message has not been sent automatically.</p>
    <p className="small-text">This is an enquiry, not a loan approval or a commitment to borrow.</p>
    <button className="secondary-button" onClick={() => { setReference(""); setBank(""); setWhatsappUrl(""); }}><RotateCcw size={16} /> Back to the form</button>
  </section>;

  return <section className="application-card" id="apply" aria-labelledby="form-title">
    <div className="form-topline"><span><span className="live-dot" /> YOUR NEXT STEP STARTS HERE</span><span>01 / 01</span></div>
    <div className="form-heading"><h2 id="form-title">Let’s find your loan.</h2><p>A few details to help us understand your needs.</p></div>
    <form onSubmit={submit} ref={formRef} noValidate>
      <fieldset disabled={busy}>
        <legend className="sr-only">Your contact and employment details</legend>
        <div className="form-grid">
          {fields.map((field) => <div className={`form-field ${field.wide ? "wide" : ""}`} key={field.name}>
            <label htmlFor={field.name}>{field.label} <span aria-hidden="true">*</span></label>
            <div className={`input-wrap ${errors[field.name] ? "invalid" : ""}`}>
              {field.prefix && <span className="input-prefix">{field.prefix}</span>}
              <input id={field.name} name={field.name} type={field.type || "text"} placeholder={field.placeholder} autoComplete={field.autoComplete} inputMode={field.inputMode} maxLength={field.maxLength || (field.name === "salary" || field.name === "loanAmount" ? 12 : 254)} required aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} />
            </div>
            {errors[field.name] && <span className="field-error" id={`${field.name}-error`}>{errors[field.name]}</span>}
          </div>)}
          <div className="form-field wide">
            <label htmlFor="salaryBank">Salary account bank <span aria-hidden="true">*</span></label>
            <div className={`input-wrap select-wrap ${errors.salaryBank ? "invalid" : ""}`}>
              <select name="salaryBank" id="salaryBank" value={bank} onChange={(e) => setBank(e.target.value)} required aria-invalid={!!errors.salaryBank} aria-describedby={errors.salaryBank ? "salaryBank-error" : undefined}>
                <option value="" disabled>Select your bank</option>
                {["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank of India", "IDFC FIRST Bank", "IndusInd Bank", "Other"].map((name) => <option key={name}>{name}</option>)}
              </select><ChevronDown size={16} aria-hidden="true" />
            </div>
            {bank === "Other" && <><label className="other-bank-label" htmlFor="otherBank">Bank name *</label><div className="input-wrap"><input id="otherBank" name="otherBank" placeholder="Enter your bank’s name" maxLength={100} required /></div></>}
            {errors.salaryBank && <span className="field-error" id="salaryBank-error">{errors.salaryBank}</span>}
          </div>
        </div>
        <div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
        <label className="consent" htmlFor="consent"><input type="checkbox" id="consent" name="consent" required aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "consent-error" : undefined} /><span>I agree to the <a href="#terms">terms & conditions</a> and <a href="/privacy">privacy notice</a>, and consent to LoanMitra India contacting me by phone, email or WhatsApp about this loan enquiry. After receipt, WhatsApp will open with my details prefilled for me to review and send.</span></label>
        {errors.consent && <p className="field-error" id="consent-error">{errors.consent}</p>}
        {error && <div className="form-error" role="alert">{error}</div>}
        {error && whatsappUrl && <div><a className="secondary-button" href={whatsappUrl} rel="noreferrer">Open WhatsApp <ArrowRight size={16} /></a><p className="form-note">Review your details and tap Send in WhatsApp.</p></div>}
        <button className="submit-button" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={20} /> Sending your enquiry…</> : <>Get a callback <ArrowRight size={19} /></>}</button>
        <p className="form-note"><LockKeyhole size={12} /> No documents or bank account numbers needed here.</p>
      </fieldset>
    </form>
    <div className="form-footer"><Check size={14} /><span>Just an enquiry. No commitment to borrow.</span></div>
  </section>;
}
