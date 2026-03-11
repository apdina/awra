import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FooterDisclaimer } from "@/app/components/ui/FooterDisclaimer";
import { LocaleHtml } from './components/LocaleHtml';

// Environment validation is now handled per-route to avoid build blocking

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AWRA - Social Casino Game Verification Platform",
  description: "Unofficial fan site for lottery result verification. Social gaming platform with transparent verification processes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LocaleHtml>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </LocaleHtml>
  );
}
