import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Privacy notice | LoanMitra India" };
export default function Privacy() {
  return <main className="privacy-page container">
    <Link className="back-link" href="/"><ArrowLeft size={16} /> Back to LoanMitra India</Link>
    <span className="eyebrow">YOUR ENQUIRY INFORMATION</span><h1>Privacy notice</h1>
    <p>This notice explains how information submitted through the loan enquiry form is used.</p>
    <h2>What the form collects</h2><p>Your name, mobile number, email address, city, PIN code, employer, monthly take-home salary, requested loan amount and salary account bank. The form also records your contact consent, the notice version, a reference number and the submission time.</p>
    <h2>Why it is collected</h2><p>The team uses these details to respond to your enquiry and discuss loan options. Submitting the form does not guarantee approval or commit you to a loan.</p>
    <h2>Where your information goes</h2><p>Enquiries are sent to the team’s configured email inbox through Gmail and to a private Google Sheet through Google Apps Script. After receipt, the website opens a WhatsApp link containing your enquiry details and the team’s number. This passes the prefilled details to WhatsApp, a Meta service. You must review the message and tap Send in WhatsApp to deliver it to the team. If email and Sheets receipt cannot be confirmed, you can choose the WhatsApp fallback link instead. Your details are not displayed publicly on this website.</p>
    <h2>What you should not submit</h2><p>This enquiry form does not ask for Aadhaar or PAN numbers, bank account numbers, passwords, OTPs or document uploads. Do not add these details to any form field.</p>
    <h2>Your choices</h2><p>Submitting an enquiry is optional. When the team contacts you, you can ask them to stop contacting you, correct your information or delete your enquiry, subject to applicable retention requirements.</p>
    <h2>Privacy contact</h2><p>{process.env.PRIVACY_CONTACT_EMAIL ? <>For privacy requests, email <a href={`mailto:${process.env.PRIVACY_CONTACT_EMAIL}`}>{process.env.PRIVACY_CONTACT_EMAIL}</a>.</> : "A privacy contact will be provided before online enquiries open."}</p>
  </main>;
}
