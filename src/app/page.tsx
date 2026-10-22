import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, BadgeIndianRupee, BriefcaseBusiness, Check, ChevronDown, Globe2, IndianRupee, Landmark, MapPin, MoveUpRight, Wallet } from "lucide-react";
import LeadForm from "@/components/lead-form";

export default function Home() {
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="LoanMitra India home"><span className="brand-icon"><IndianRupee size={23} strokeWidth={2.3} /></span><span>loan<span className="brand-light">mitra</span><span className="brand-india">INDIA</span></span></Link>
        <nav aria-label="Main navigation"><a href="#eligibility">Who can apply</a><a href="#terms">Things to know</a></nav>
        <a className="header-cta" href="#apply">Let’s get started <ArrowUpRight size={16} /></a>
      </div>
    </header>
    <main id="main" className="container main-grid">
      <section className="info-section" aria-labelledby="hero-title">
        <div className="eyebrow hero-eyebrow"><span className="eyebrow-line" /> FOR INDIA’S SALARIED PROFESSIONALS</div>
        <h1 id="hero-title">You work hard.<br />Your plans deserve<br /><span>a little support.</span><span className="heading-dot">.</span></h1>
        <p className="hero-copy">A new chapter. A family milestone. A plan you’ve put on hold. Explore personal loan options that move life forward.</p>
        <div className="rate-panel">
          <div className="rate-main"><span className="rate-label">INTEREST RATES FROM</span><div className="rate-number">9.99<span>%<small>p.a.*</small></span></div></div>
          <div className="rate-separator" />
          <div className="rate-caption"><span className="mini-icon"><MoveUpRight size={18} /></span><p>A little help.<br /><strong>A world of possibilities.</strong></p></div>
        </div>
        <p className="rate-disclaimer">*Starting rate. Your final rate, fees and approval depend on the lender and your profile.</p>
        <div className="eligibility-block" id="eligibility">
          <div className="section-label"><span>MADE FOR YOUR NEXT CHAPTER</span><ArrowDown size={14} /></div>
          <div className="eligibility-item"><span className="feature-icon"><Wallet size={20} /></span><div><h3>₹18,000+ monthly salary</h3><p>A steady income to take the next step.</p></div><Check className="feature-check" size={17} /></div>
          <div className="eligibility-item"><span className="feature-icon"><BriefcaseBusiness size={20} /></span><div><h3>Exclusively for salaried individuals</h3><p>For people employed and earning in India.</p></div><Check className="feature-check" size={17} /></div>
          <div className="eligibility-item"><span className="feature-icon"><Globe2 size={20} /></span><div><h3>Across India. Across banks.</h3><p>Enquiries welcome from all salary account banks.</p></div><Check className="feature-check" size={17} /></div>
        </div>
        <div className="india-banner"><span className="india-symbol"><MapPin size={22} /></span><div><span>From your city. For your next step.</span><p>Personal loan enquiries, pan India.</p></div><span className="india-dots" aria-hidden="true"><i /><i /><i /></span></div>
        <div className="terms-block" id="terms">
          <div className="terms-title"><span className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</span><h2>Good to know.</h2></div>
          <details open><summary>Who can enquire? <ChevronDown size={17} /></summary><p>Indian residents employed on a salaried basis, with a monthly take-home salary of at least ₹18,000, can submit an enquiry. Meeting this threshold does not guarantee approval. Lenders may apply additional age, employment, credit and location criteria.</p></details>
          <details><summary>How are rates and charges decided? <ChevronDown size={17} /></summary><p>The indicative starting interest rate is 9.99% per annum. The actual rate, loan amount, tenure, processing fees, taxes and other charges depend on the lender and your credit profile. Review the lender’s final offer and repayment terms before accepting.</p></details>
          <details><summary>What happens after I submit? <ChevronDown size={17} /></summary><p>Your enquiry details are sent to the team by email and Google Sheets. After receipt, WhatsApp opens with a prefilled message to the team’s number. Review it and tap Send in WhatsApp; opening the chat does not send the message. This form is an expression of interest, not a sanctioned loan application or a promise of disbursal.</p></details>
          <details><summary>Can I apply with any salary account bank? <ChevronDown size={17} /></summary><p>You can enquire from anywhere in India, regardless of your salary account bank. Available lenders and loan products depend on your profile and serviceable location. A bank appearing in the form identifies your salary account and does not imply a lending partnership.</p></details>
        </div>
      </section>
      <aside className="form-column"><LeadForm /><div className="after-form"><span className="after-form-icon"><Landmark size={19} /></span><p><strong>Your plans, your pace.</strong><br />Explore your options before you decide.</p></div><div className="decorative-note" aria-hidden="true"><BadgeIndianRupee size={100} strokeWidth={0.6} /><span>Small steps.<br /><em>Bigger possibilities.</em></span></div></aside>
    </main>
    <footer className="site-footer"><div className="container footer-inner"><p>© {new Date().getFullYear()} LoanMitra India</p><span>Helping your next chapter begin.</span><div><a href="#terms">Terms & conditions</a><Link href="/privacy">Privacy notice <ArrowRight size={12} /></Link></div></div></footer>
  </>;
}
