import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FooterDisclaimer } from "@/app/components/ui/FooterDisclaimer";
import { LocaleHtml } from './components/LocaleHtml';
import AdBlockWarning from '@/components/AdBlockWarning';
import Script from 'next/script';

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
      <head>
        <Script defer src="https://cloud.umami.is/script.js" data-website-id="8e07a050-717f-4af1-a570-76fd4ac5d5d2" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        {children}
        <AdBlockWarning />
      </body>
    </LocaleHtml>
  );

}
