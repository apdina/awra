import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/ConvexAuthProvider";
import { FooterDisclaimer } from "@/app/components/ui/FooterDisclaimer";
import { PageLoader } from "@/app/components/ui/PageLoader";
import NavigationWrapper from "@/app/components/NavigationWrapper";
import { getServerTranslations, isValidLocale, defaultLocale, type Locale } from '@/i18n/utils';
import { TranslationProvider } from '@/i18n/translation-context';
import { NotificationProvider } from "../contexts/NotificationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const resolvedParams = await params;
  const t = await getServerTranslations(isValidLocale(resolvedParams.locale) ? resolvedParams.locale as Locale : defaultLocale, 'common');
  
  return {
    title: t('site_title'),
    description: t('site_description'),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const resolvedParams = await params;
  
  // No server session needed with Convex auth
  const serverSession = null;
  
  return (
    <>
      <PageLoader />
      
      <NotificationProvider>
        {/* Pass server session to prevent hydration mismatch */}
        <AuthProvider>
          <TranslationProvider initialLocale={isValidLocale(resolvedParams.locale) ? resolvedParams.locale as Locale : defaultLocale}>
            <NavigationWrapper />
            <div className="flex-1 mt-16">
              {children}
            </div>
            <FooterDisclaimer />
          </TranslationProvider>
        </AuthProvider>
      </NotificationProvider>
    </>
  );
}