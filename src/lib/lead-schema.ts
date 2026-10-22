import { z } from "zod";

export const leadSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(100),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  city: z.string().trim().min(2, "Enter your city.").max(100),
  pincode: z.string().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code."),
  employer: z.string().trim().min(2, "Enter your employer’s name.").max(150),
  salary: z.number().finite().min(18000, "A minimum monthly salary of ₹18,000 is required.").max(100000000),
  loanAmount: z.number().finite().positive("Enter the loan amount you need.").max(100000000),
  salaryBank: z.string().trim().min(2, "Enter your salary account bank.").max(100),
  consent: z.literal(true, { error: "Please agree to be contacted about your enquiry." }),
  website: z.string().max(0, "Invalid submission.").optional().default(""),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type Lead = LeadInput & { id: string; submittedAt: string; consentVersion: string };
export const CONSENT_VERSION = "2026-10-22-v2";
