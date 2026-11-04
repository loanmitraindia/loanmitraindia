
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Notifications from "@/components/notifications";

export const metadata: Metadata = {
  title: "LoanMitra India | Personal loans, hybrid flexi & overdraft enquiries",
  description:
    "Explore personal loan, hybrid flexi loan and overdraft options for salaried applicants across India. Estimate personal loan EMIs with an adjustable rate calculator. Subject to lender eligibility.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body>
        {/* Google Ads - Initialize Google Tag */}
        <Script id="google-ads-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            window.gtag = function() {
              window.dataLayer.push(arguments);
            };
            window.gtag('js', new Date());
            window.gtag('config', 'AW-867700663');
          `}
        </Script>

        {/* Google Ads - Load Tracking Script */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-867700663"
          strategy="afterInteractive"
        />

        {children}
        <Notifications />
      </body>
    </html>
  );
}
