import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoanMitra India | Personal loans for salaried professionals",
  description: "Explore personal loan options across India. For salaried applicants earning ₹18,000 or more per month. Interest rates from 9.99% p.a., subject to lender eligibility.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-IN"><body>{children}</body></html>;
}
