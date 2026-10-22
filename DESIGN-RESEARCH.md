# LoanMitra India — design research

Research date: 22 October 2026. LoanMitra India is a working name inferred from the project folder, pending client branding.

## Recommendation

A light editorial design with deep navy typography, warm white surfaces, restrained saffron accents, and muted green for eligibility indicators. The intent is to feel approachable and established while keeping the financial details and enquiry form easy to scan. This is a design recommendation, not a claim that any colour guarantees trust or conversion.

| Colour | Hex | Use |
|---|---|---|
| Deep navy | #132C44 | Headings, brand, main callback button |
| Warm white | #FAF9F6 | Page background |
| White | #FFFFFF | Form surface |
| Burnt saffron | #B65320 | Emphasised headline, decorative accents |
| Muted green | #256751 | Eligibility checks and confirmation |
| Slate | #4F606C | Body text |
| Soft grey | #E2E5E5 | Dividers; not used as the sole input boundary cue |

Alternatives considered: navy + teal for a conventional fintech feel; forest green + ivory for a more restrained advisory feel. Navy + saffron makes the selected direction warmer and provides a subtle Indian cue without making the page resemble a government scheme.

Typography: Manrope for headings, DM Sans for body and controls, with Arial fallback. Main headline uses sentence case and generous spacing. No fabricated testimonials, partner logos, approval counts or disbursal promises.

## Research findings applied

- [HDFC Bank salaried loan page](https://www.hdfc.bank.in/personal-loan/loan-for-salaried) separates eligibility, rates, charges and conditions. Apply that content hierarchy, using the client's own ₹18,000 threshold rather than importing the bank's requirements.
- [Axis Bank personal loan page](https://www.axis.bank.in/loans/personal-loan) gives prominence to the offer and application action. Keep the callback action visible beside the information on desktop.
- [W3C form label guidance](https://www.w3.org/WAI/tutorials/forms/labels/) recommends visible, associated labels. The form uses permanent labels, explicit consent, field errors and suitable mobile keyboards.
- [W3C contrast guidance](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) requires at least 4.5:1 for normal text. Main text, CTA and accent text pairs were checked against their backgrounds. Separators are decorative.

## Two-section structure

1. Information: headline, introductory copy, 9.99% p.a. starting rate, salary threshold, salaried eligibility, pan-India availability and expandable terms.
2. Enquiry: contact, location, employer, take-home salary, desired loan amount, salary bank and contact consent.

On small screens the form sits after the eligibility information and before the full terms. This keeps the initial explanation short and gives the user a direct path to the form.

Use ₹, Indian grouping such as ₹3,00,000, +91 mobile inputs and a six-digit PIN code. Do not use national emblems, government seals or a bank logo to imply endorsement. “All banks” refers to enquiry eligibility from salary account banks; actual lending partnerships need client confirmation.

## Client details to finalise

Confirm the public business name, business identity (direct lender or intermediary), actual lender relationships, starting rate and salary threshold, privacy contact, retention policy and final customer-facing terms. The draft does not claim to be a bank or guarantee approval. Destination configuration requires provider credentials as well as the email address, sheet ID and WhatsApp number.
