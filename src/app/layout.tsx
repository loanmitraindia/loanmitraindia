import type { Metadata } from "next";
import "./globals.css";
import Notifications from "@/components/notifications";

export const metadata: Metadata = {
  title: "LoanMitra India | EMI calculator & personal loan enquiries",
  description: "Estimate your personal loan EMI at an illustrative 9.9% p.a. and request a callback. Enquiries for salaried residents of India earning ₹18,000+ monthly; subject to lender eligibility.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-IN"><body>{children}<Notifications /></body></html>;
}
