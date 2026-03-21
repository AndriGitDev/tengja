import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
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
      </body>
    </html>
  );
}
