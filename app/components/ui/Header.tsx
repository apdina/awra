"use client";

import Link from "next/link";
import { User, Session } from "@/types/game";
import { useAuth } from "@/components/ConvexAuthProvider";
import { useTranslations } from '@/i18n/utils';
import { usePathname } from 'next/navigation';
import { CurrencyDisplay } from "@/components/CurrencyDisplay";

interface HeaderProps {
  session: Session | null;
  setSession: (session: Session | null) => void;
}

export const Header = ({ session, setSession }: HeaderProps) => {
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] || 'es';
  const t = useTranslations(currentLocale);
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      console.log("🚪 Header logout initiated");
      await logout();
    } catch (error) {
      console.error("Header logout error:", error);
    }
  };


  return (
    <>
      <header className="w-full glass-card border-b border-gray-700/50 p-4 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <div className="gradient-text-yellow font-bold text-xl">AWRA</div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                {/* Balance Display */}
                <div className="glass-card rounded-lg px-4 py-2 border border-gray-600/50">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">{t('navigation.balance')}</div>
                  <div className="text-lg font-bold text-white">
                    <CurrencyDisplay 
                      amount={session.user.awra_coins} 
                      showDecimals={true}
                      size="md"
                    />
                  </div>
                </div>

                {/* Get Coins button - Social Casino */}
                <div className="flex space-x-2">
                  <Link 
                    href={`/${currentLocale}/account`}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-3 py-1 rounded text-sm font-bold transition-all duration-200 transform hover:scale-105"
                  >
                    {t('navigation.get_coins')}
                  </Link>
                </div>

                {/* User Menu */}
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{session.user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-3 py-1 rounded text-sm font-bold transition-all duration-200 transform hover:scale-105"
                  >
                    {t('navigation.logout')}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href={`/${currentLocale}/login`}
                  className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-black px-4 py-2 rounded font-bold transition-all duration-200 transform hover:scale-105 inline-block"
                >
                  {t('navigation.login')}
                </Link>
                <Link
                  href={`/${currentLocale}/register`}
                  className="glass-card hover:bg-gray-700/70 text-white px-4 py-2 rounded font-bold transition-all duration-200 transform hover:scale-105 inline-block border border-gray-600/50"
                >
                  {t('navigation.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};