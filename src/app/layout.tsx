import type { Metadata } from "next";
import "./globals.css";
import Notifications from "@/components/notifications";

export const metadata: Metadata = {
  title: "LoanMitra India | Personal loans, hybrid flexi & overdraft enquiries",
  description: "Explore personal loan, hybrid flexi loan and overdraft options for salaried applicants across India. Estimate personal loan EMIs with an adjustable rate calculator. Subject to lender eligibility.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-IN"><body>{children}<Notifications /></body></html>;
}
