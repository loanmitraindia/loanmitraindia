import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, ChevronDown, Globe2, IndianRupee, Wallet } from "lucide-react";
import LoanJourney from "@/components/loan-journey";
import { BankMarquee, FeatureStrip, Reveal } from "@/components/page-motion";

const banks = [
  { name: "State Bank of India", file: "sbi.png" },
  { name: "HDFC Bank", file: "hdfc.webp" },
  { name: "ICICI Bank", file: "icici.svg" },
  { name: "Axis Bank", file: "axis.svg" },
  { name: "Kotak Mahindra Bank", file: "kotak.svg" },
  { name: "Bank of Baroda", file: "baroda.png" },
];
const steps = [
  { title: "Send your enquiry", copy: "Share your details and the amount you need." },
  { title: "Receive confirmation", copy: "After receipt, WhatsApp opens with a draft message. Review it and tap Send if you want to share it there." },
  { title: "Discuss your options", copy: "Our team reviews your enquiry and contacts you to discuss available options. Approval and final terms depend on the lender." },
];

export default function Home() {
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="LoanMitra India home"><span className="brand-icon"><IndianRupee size={23} strokeWidth={2.3} /></span><span>loan<span className="brand-light">mitra</span><span className="brand-india">INDIA</span></span></Link>
        <nav aria-label="Main navigation"><a href="#emi-calculator">EMI calculator</a><a href="#apply">Request a callback</a><a href="#terms">FAQs</a></nav>
        <a className="header-cta" href="#apply">Request a callback <ArrowUpRight size={16} aria-hidden="true" /></a>
      </div>
    </header>
    <main id="main">
      <LoanJourney intro={
        <section className="journey-heading" aria-labelledby="hero-title">
          <div className="eyebrow">PERSONAL LOAN ENQUIRIES FOR SALARIED APPLICANTS</div>
          <h1 id="hero-title">Calculate your EMI. <span>Request a loan callback.</span></h1>
          <p className="journey-copy">Estimate your monthly repayment, or send an enquiry for our team to review and discuss available personal loan options.</p>
          <div className="journey-rate"><p>Rates from <strong>9.9% p.a.*</strong></p><p className="rate-disclaimer">*Starting rate. Your final rate, fees and approval depend on the lender and your profile.</p></div>
          <div className="journey-eligibility" id="eligibility" aria-label="Who can apply">
            <div><Wallet size={19} aria-hidden="true" /><span><strong>₹18,000+</strong> monthly take-home salary</span></div>
            <div><BriefcaseBusiness size={19} aria-hidden="true" /><span>Salaried residents of India</span></div>
            <div><Globe2 size={19} aria-hidden="true" /><span>Enquiries across India</span></div>
          </div>
        </section>
      } steps={
        <section className="callback-steps" id="how-it-works" aria-labelledby="steps-title">
          <h2 id="steps-title">What happens after your enquiry?</h2>
          <ol>{steps.map(step => <li key={step.title}><h3>{step.title}</h3><p>{step.copy}</p></li>)}</ol>
        </section>
      } />
      <section className="container bank-section" aria-labelledby="banks-title">
        <h2 id="banks-title">Enquiries welcome from all salary-account banks.</h2>
        <BankMarquee>{banks.map(bank => <div className="bank-tile" key={bank.name}><Image src={`/banks/${bank.file}`} alt={bank.name} width={160} height={52} loading="lazy" unoptimized /></div>)}</BankMarquee>
        <p className="bank-caption">Examples of salary-account banks. These logos do not indicate lending partnerships or guaranteed loan availability.</p>
      </section>
      <FeatureStrip />

      <section className="faq-section" id="terms" aria-labelledby="terms-title">
        <div className="container faq-content">
          <Reveal><h2 id="terms-title">Questions about your EMI and enquiry</h2></Reveal>
          <div className="faq-list">
            <details open><summary>Who can submit a loan enquiry? <ChevronDown size={17} /></summary><p>Salaried residents of India with a monthly take-home salary of at least ₹18,000 can submit an enquiry. Lenders may apply additional age, employment, credit and location criteria. Meeting the salary threshold does not guarantee approval.</p></details>
            <details><summary>How is my EMI estimate calculated? <ChevronDown size={17} /></summary><p>The calculator uses your selected amount and tenure with an illustrative annual interest rate of 9.9%, calculated monthly on a reducing balance. It shows estimated monthly EMI, total interest and total repayment, rounded to the nearest rupee. Processing fees, taxes and other charges are excluded. The calculator’s amount and tenure ranges are examples, not eligibility limits.</p></details>
            <details><summary>Is the 9.9% interest rate guaranteed? <ChevronDown size={17} /></summary><p>No. The advertised starting rate and calculator estimate are not a personalised loan offer. Your actual rate, EMI, tenure, fees and approval depend on the lender and your profile. Review the lender’s final terms before accepting a loan.</p></details>
            <details><summary>Can I use the calculator without submitting my details? <ChevronDown size={17} /></summary><p>Yes. Calculations run in your browser and do not require contact details. “Enquire for this amount” only copies the selected amount into the enquiry form. Your form details are sent only when you submit the enquiry with contact consent.</p></details>
            <details><summary>What happens after I request a callback? <ChevronDown size={17} /></summary><p>After receipt is confirmed, you see an enquiry reference and WhatsApp opens with a draft message. Review it and tap Send if you want to share it there; opening the chat does not send the message. Our team reviews your enquiry and contacts you to discuss available options. Submitting an enquiry does not guarantee approval or commit you to a loan.</p></details>
            <details><summary>Are the banks shown your lending partners? <ChevronDown size={17} /></summary><p>The logos are examples of salary-account banks, not a list of lending partners. Enquiries are welcome regardless of your salary account bank. Available lenders and loan products depend on your profile and serviceable location.</p></details>
          </div>
        </div>
      </section>
    </main>
    <footer className="site-footer"><div className="container footer-inner"><p>© {new Date().getFullYear()} LoanMitra India</p><div><a href="#terms">Terms & conditions</a><Link href="/privacy">Privacy notice <ArrowRight size={12} /></Link></div></div></footer>
  </>;
}
