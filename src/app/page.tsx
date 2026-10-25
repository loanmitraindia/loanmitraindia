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
const featuredLenders = [
  { title: "NBFC options", names: ["Bajaj Finance", "Aditya Birla Capital", "Poonawalla Fincorp", "Cholamandalam (Chola)", "Piramal Finance"] },
  { title: "Bank options", names: ["Kotak Mahindra Bank", "ICICI Bank", "Axis Bank", "HDFC Bank"] },
];
const steps = [
  { title: "Send your enquiry", copy: "Choose personal loan, hybrid flexi loan or overdraft, then share your details and required amount or credit limit." },
  { title: "Receive confirmation", copy: "After receipt, WhatsApp opens with a draft message. Review it and tap Send if you want to share it there." },
  { title: "Discuss your options", copy: "Our team reviews your enquiry and contacts you to discuss available options. Approval and final terms depend on the lender." },
];

export default function Home() {
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="LoanMitra India home"><span className="brand-icon"><IndianRupee size={23} strokeWidth={2.3} /></span><span>loan<span className="brand-light">mitra</span><span className="brand-india">INDIA</span></span></Link>
        <nav aria-label="Main navigation"><a href="#emi-calculator">EMI calculator</a><a href="#apply">Loan enquiry</a><a href="#terms">FAQs</a></nav>
        <a className="header-cta" href="#apply">Apply now <ArrowUpRight size={16} aria-hidden="true" /></a>
      </div>
    </header>
    <main id="main">
      <LoanJourney intro={
        <section className="journey-heading" aria-labelledby="hero-title">
          <aside className="lender-banner" aria-labelledby="lender-banner-title">
            <p className="lender-banner-title" id="lender-banner-title">For salaried applicants across India</p>
            <div className="lender-banner-groups">
              {featuredLenders.map(group => <div className="lender-banner-group" key={group.title}>
                <h2>{group.title}</h2>
                <ul>{group.names.map(name => <li key={name}>{name}</li>)}</ul>
              </div>)}
            </div>
            <p className="lender-banner-note">Available products and lenders depend on your profile and serviceable location. Approval and final terms depend on the lender.</p>
          </aside>
          <h1 id="hero-title">Apply for a personal loan, <span>hybrid flexi loan or overdraft.</span></h1>
          <p className="journey-copy">Explore options from banks and NBFCs. Estimate a personal loan EMI below, or share your requirements for our team to review.</p>
          <div className="journey-rate"><p>Personal loan rates from <strong>9.9% p.a.*</strong></p><p className="rate-disclaimer">*Starting rate. Your final rate, fees and approval depend on the lender and your profile.</p></div>
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
      <section className="container lender-section" aria-labelledby="lenders-title">
        <h2 id="lenders-title">Options from banks and NBFCs</h2>
        <p>Discuss bank and NBFC options with our team, including these NBFCs:</p>
        <ul className="lender-list"><li>Bajaj Finance</li><li>Tata Capital</li><li>Aditya Birla Capital</li></ul>
        <p className="bank-caption">Available products and lenders depend on your profile and serviceable location.</p>
      </section>
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
            <details open><summary>Who can submit a loan enquiry? <ChevronDown size={17} /></summary><p>Salaried residents of India with a monthly take-home salary of at least ₹18,000 can enquire about a personal loan, hybrid flexi loan or overdraft facility. Enquiries are welcome across India. Each lender applies its own age, employment, credit, income and serviceable-location criteria; meeting this salary threshold does not guarantee eligibility or approval for any product.</p></details>
            <details><summary>How is my EMI estimate calculated? <ChevronDown size={17} /></summary><p>The calculator uses your selected amount, tenure and annual interest rate, calculated monthly on a reducing balance. The initial 9.9% rate is illustrative and can be changed. It shows estimated monthly EMI, total interest and total repayment, rounded to the nearest rupee. Processing fees, taxes and other charges are excluded. Calculator ranges are examples, not eligibility limits. This calculation is for standard personal loans, not hybrid flexi loans or overdrafts.</p></details>
            <details><summary>How do personal loans, hybrid flexi loans and overdrafts differ? <ChevronDown size={17} /></summary><p>A standard personal loan is repaid through scheduled instalments. Hybrid flexi loans can offer flexible withdrawals and an initial interest-only repayment phase, subject to the lender’s terms. An overdraft is a credit facility with interest generally based on the amount used and the time it remains outstanding. These products have different fees, limits and repayment obligations. Our team can discuss the available options; the EMI calculator does not model flexi or overdraft repayments.</p></details>
            <details><summary>Is the 9.9% interest rate guaranteed? <ChevronDown size={17} /></summary><p>No. The advertised starting rate and calculator estimate are not a personalised loan offer. Your actual rate, EMI, tenure, fees and approval depend on the lender and your profile. Review the lender’s final terms before accepting a loan.</p></details>
            <details><summary>Can I use the calculator without submitting my details? <ChevronDown size={17} /></summary><p>Yes. Calculations run in your browser and do not require contact details. “Enquire for this amount” only copies the selected amount into the enquiry form. Your form details are sent only when you submit the enquiry with contact consent.</p></details>
            <details><summary>What happens after I submit an enquiry? <ChevronDown size={17} /></summary><p>After receipt is confirmed, you see an enquiry reference and WhatsApp opens with a draft message including your product interest. Review it and tap Send if you want to share it there; opening the chat does not send the message. Our team reviews your requirements and contacts you to discuss available options. Submitting an enquiry does not guarantee approval or commit you to a loan.</p></details>
            <details><summary>Are the banks shown your lending partners? <ChevronDown size={17} /></summary><p>The logos are examples of salary-account banks, not a list of lending partners. Enquiries are welcome regardless of your salary account bank. Available lenders and loan products depend on your profile and serviceable location.</p></details>
          </div>
        </div>
      </section>
    </main>
    <footer className="site-footer"><div className="container footer-inner"><p>© {new Date().getFullYear()} LoanMitra India</p><div><a href="#terms">Terms & conditions</a><Link href="/privacy">Privacy notice <ArrowRight size={12} /></Link></div></div></footer>
  </>;
}
