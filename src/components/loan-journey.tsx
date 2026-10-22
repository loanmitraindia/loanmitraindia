"use client";

import { useRef, useState, type ReactNode } from "react";
import EmiCalculator, { type EnquiryStatus } from "@/components/emi-calculator";
import LeadForm, { type LoanPrefill } from "@/components/lead-form";

export default function LoanJourney({ intro, steps }: { intro: ReactNode; steps: ReactNode }) {
  const [status, setStatus] = useState<EnquiryStatus>("idle");
  const [prefill, setPrefill] = useState<LoanPrefill>();
  const nextId = useRef(0);
  return <>
    <div className="container journey-intro">{intro}</div>
    <div className="container tools-grid">
      <EmiCalculator status={status} onEnquire={amount => { if (status === "idle") setPrefill({ amount, id: ++nextId.current }); }} />
      <div className="enquiry-form"><LeadForm prefill={prefill} onStatusChange={setStatus} /></div>
      {steps}
    </div>
  </>;
}
