"use client";

import Link from "next/link";
import { useTranslationsFromPath } from '@/i18n/translation-context';

export default function AuthHeader() {
  const { locale } = useTranslationsFromPath();
  
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="text-center">
        <Link href={`/${locale}/`} className="text-yellow-500 font-bold text-3xl tracking-widest hover:text-yellow-400 transition-colors">
          AWRA
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold text-white">
          Daily Lottery Game
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Your chance to win big every day (except Sundays)
        </p>
      </div>
    </div>
  );
}
