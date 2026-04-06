import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "TENGJA — Iceland's Network Pulse",
  description:
    "Real-time visualization of Iceland's submarine cable infrastructure and internet connectivity",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="is" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans bg-[var(--noc-bg)] text-[var(--noc-text)] antialiased">
        {children}
        <Script
          src="https://cdn.jsdelivr.net/npm/swetrix@latest/dist/swetrix.js"
          strategy="afterInteractive"
        />
        <Script id="swetrix-init" strategy="afterInteractive">
          {`
            document.addEventListener('DOMContentLoaded', function() {
              swetrix.init('WILzAne5IauA', {
                apiURL: 'https://swetrixapi.kastro.is/log',
              })
              swetrix.trackViews()
            })
            if (document.readyState !== 'loading') {
              swetrix.init('WILzAne5IauA', {
                apiURL: 'https://swetrixapi.kastro.is/log',
              })
              swetrix.trackViews()
            }
          `}
        </Script>
        <noscript>
          <img
            src="https://swetrixapi.kastro.is/log/noscript?pid=WILzAne5IauA"
            alt=""
            referrerPolicy="no-referrer-when-downgrade"
          />
        </noscript>
      </body>
    </html>
  );
}
