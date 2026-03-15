"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, Session } from "@/types/game";
import { User as UserIcon, ChevronDown, Menu, X } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslationsFromPath } from '@/i18n/translation-context';
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import UserAvatar from "@/components/UserAvatar";

interface NavigationProps {
  isAuthenticated: boolean;
  user?: User;
  session: Session | null;
  loading?: boolean;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export function Navigation({ isAuthenticated, user, session, loading = false, onLogout, onNavigateHome }: NavigationProps) {
  // Debug log to see when user data changes
  useEffect(() => {
    console.log("🔍 Navigation component state:", { 
      isAuthenticated, 
      userId: user?.id, 
      balance: user?.awra_coins,
      loading,
      hasSession: !!session
    });
  }, [user?.id, isAuthenticated, loading, session]);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslationsFromPath();

  // Extract current locale from pathname
  const currentLocale = pathname.split('/')[1] || 'en';

  // Helper function to determine if a link is active
  const isActive = (href: string) => {
    const currentPathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
    if (href === "/" && currentPathWithoutLocale === "/") return true;
    if (href !== "/" && currentPathWithoutLocale.startsWith(href)) return true;
    return false;
  };

  // Helper function to create locale-aware href
  const createLocaleHref = (href: string) => {
    return `/${currentLocale}${href}`;
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    if (showUserMenu || showMobileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu, showMobileMenu]);

  return (
    <nav dir="ltr" style={{ direction: 'ltr' }} className="fixed top-0 left-0 right-0 glass-card border-b border-gray-700/50 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={onNavigateHome}
              className="gradient-text-yellow font-bold text-xl hover:scale-105 transition-all duration-200 transform"
            >
              AWRA
            </button>
          </div>

          <div className="hidden md:flex flex-1 justify-center items-center space-x-1">   
            <button
              onClick={onNavigateHome}
              className={`px-2 py-1 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                isActive("/")
                  ? "bg-yellow-600 text-black"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              {t('navigation.home')}
            </button>
            <Link
              href={createLocaleHref("/play")}
              className={`px-2 py-1 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                isActive("/play")
                  ? "bg-yellow-600 text-black"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              {t('navigation.play_now')}
            </Link>
            <Link
              href={createLocaleHref("/how-to-play")}
              className={`px-2 py-1 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                isActive("/how-to-play")
                  ? "bg-yellow-600 text-black"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              {t('navigation.how_to_play')}
            </Link>
            <Link
              href={createLocaleHref("/winning-numbers")}
              className={`px-2 py-1 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                isActive("/winning-numbers")
                  ? "bg-yellow-600 text-black"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              {t('navigation.winning_numbers')}
            </Link>
            <Link
              href={createLocaleHref("/about")}
              className={`px-2 py-1 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                isActive("/about")
                  ? "bg-yellow-600 text-black"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              {t('navigation.about')}
            </Link>
            <Link
              href={createLocaleHref("/terms")}
              className={`px-2 py-1 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                isActive("/terms")
                  ? "bg-yellow-600 text-black"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              {t('navigation.terms')}
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSwitcher currentLocale={currentLocale} />
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-600 animate-pulse hidden md:block"></div>
            ) : isAuthenticated ? (
              <div className="relative md:block hidden" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-2 py-1 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  <UserAvatar
                    user={user ? {
                      displayName: user.username || 'User',
                      avatarUrl: (user as any).avatarUrl,
                      avatarName: (user as any).avatarName,
                      avatarType: (user as any).avatarType,
                      usePhoto: (user as any).usePhoto,
                      userPhoto: (user as any).userPhoto,
                    } : null}
                    size="sm"
                  />
                  <span className="hidden md:inline">{user?.username || "User"}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg glass-card border border-gray-700/50 py-1 z-50 opacity-100 transition-opacity duration-200 backdrop-blur-md">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-sm font-medium text-white">{user?.username || "User"}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email || ""}</p>
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <p className="text-xs text-gray-400">{t('navigation.balance')}</p>
                        <Link
                          href={createLocaleHref("/account")}
                          onClick={() => setShowUserMenu(false)}
                          className="text-sm font-bold text-yellow-500 hover:text-yellow-400 transition-colors cursor-pointer block"
                        >
                          <CurrencyDisplay amount={user?.awra_coins || 0} showDecimals />
                        </Link>
                      </div>
                    </div>
                    <Link
                      href={createLocaleHref("/account")}
                      onClick={() => setShowUserMenu(false)}
                      className={`flex items-center px-4 py-2 text-sm transition-colors ${
                        isActive("/account")
                          ? "bg-yellow-600 text-black"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      <UserIcon className="w-4 h-4 mr-3" />
                      {t('navigation.account_settings')}
                    </Link>
                    <Link
                      href={createLocaleHref("/tickets")}
                      onClick={() => setShowUserMenu(false)}
                      className={`flex items-center px-4 py-2 text-sm transition-colors ${
                        isActive("/tickets")
                          ? "bg-yellow-600 text-black"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h3a2 2 0 002-2V7a2 2 0 00-2-2H5zM5 13a2 2 0 00-2 2v3a2 2 0 002 2h3a2 2 0 002-2v-3a2 2 0 00-2-2H5zM19 5a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V7a2 2 0 012-2h3zM19 13a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2v-3a2 2 0 012-2h3z" />
                      </svg>
                      {t('navigation.my_tickets')}
                    </Link>
                    <div className="border-t border-gray-700 my-1"></div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {t('navigation.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  href={createLocaleHref("/login")}
                  className={`px-2 py-1 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                    isActive("/login")
                      ? "bg-yellow-600 text-black"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  {t('navigation.login')}
                </Link>
                <Link
                  href={createLocaleHref("/register")}
                  className={`px-2 py-1 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                    isActive("/register")
                      ? "bg-yellow-600 text-black"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  {t('navigation.register')}
                </Link>
              </div>
            )}

            <div className="md:hidden flex items-center">
              {isAuthenticated && !loading && (
                <Link
                  href={createLocaleHref("/account")}
                  className="relative p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  <div className="relative">
                    <UserAvatar
                      user={user ? {
                        displayName: user.username || 'User',
                        avatarUrl: (user as any).avatarUrl,
                        avatarName: (user as any).avatarName,
                        avatarType: (user as any).avatarType,
                        usePhoto: (user as any).usePhoto,
                        userPhoto: (user as any).userPhoto,
                      } : null}
                      size="sm"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                  </div>
                </Link>
              )}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-500"
              >
                {showMobileMenu ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden" ref={mobileMenuRef}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 glass-card border-t border-gray-700/50 backdrop-blur-md">
            <button
              onClick={() => {
                onNavigateHome();
                setShowMobileMenu(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                isActive("/") 
                  ? "bg-yellow-600 text-black" 
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              {t('navigation.home')}
            </button>
            <Link
              href={createLocaleHref("/play")}
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                isActive("/play")
                  ? "bg-yellow-600 text-black"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              {t('navigation.play_now')}
            </Link>
            <Link
              href={createLocaleHref("/how-to-play")}
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                isActive("/how-to-play")
                  ? "bg-yellow-600 text-black"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              {t('navigation.how_to_play')}
            </Link>
            <Link
              href={createLocaleHref("/winning-numbers")}
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                isActive("/winning-numbers")
                  ? "bg-yellow-600 text-black"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              {t('navigation.winning_numbers')}
            </Link>
            <Link 
              href={createLocaleHref("/about")} 
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                isActive("/about") 
                  ? "bg-yellow-600 text-black" 
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              {t('navigation.about')}
            </Link>
            <Link 
              href={createLocaleHref("/terms")} 
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                isActive("/terms") 
                  ? "bg-yellow-600 text-black" 
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              {t('navigation.terms')}
            </Link>
            
            {/* Mobile Auth Section */}
            {loading ? (
              <div className="flex items-center space-x-2 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gray-600 animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-600 rounded animate-pulse"></div>
              </div>
            ) : isAuthenticated ? (
              <>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  {/* User Info */}
                  <div className="px-3 py-2">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <UserAvatar 
                          user={user ? {
                            displayName: user.username || 'User',
                            avatarUrl: (user as any).avatarUrl,
                            avatarName: (user as any).avatarName,
                            avatarType: (user as any).avatarType,
                            usePhoto: (user as any).usePhoto,
                            userPhoto: (user as any).userPhoto,
                          } : null}
                          size="sm"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user?.username || "User"}</p>
                        <p className="text-xs text-gray-400">{user?.email || ""}</p>
                        <Link 
                          href={createLocaleHref("/account")}
                          onClick={() => setShowMobileMenu(false)}
                          className="text-xs text-yellow-500 font-medium hover:text-yellow-400 transition-colors cursor-pointer inline-block"
                        >
                          <CurrencyDisplay amount={user?.awra_coins || 0} showDecimals />
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* User Menu Items */}
                  <Link
                    href={createLocaleHref("/account")}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center px-3 py-2 text-base font-medium transition-colors ${
                      isActive("/account")
                        ? "bg-yellow-600 text-black"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <UserIcon className="w-4 h-4 mr-3" />
                    {t('navigation.account_settings')}
                  </Link>
                  <Link
                    href={createLocaleHref("/tickets")}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center px-3 py-2 text-base font-medium transition-colors ${
                      isActive("/tickets")
                        ? "bg-yellow-600 text-black"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h3a2 2 0 002-2V7a2 2 0 00-2-2H5zM5 13a2 2 0 00-2 2v3a2 2 0 002 2h3a2 2 0 002-2v-3a2 2 0 00-2-2H5zM19 5a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V7a2 2 0 012-2h3zM19 13a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2v-3a2 2 0 012-2h3z" />
                    </svg>
                    {t('navigation.my_tickets')}
                  </Link>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center px-3 py-2 text-base font-medium text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('navigation.logout')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="border-t border-gray-700 pt-2 mt-2 space-y-1">
                  <Link 
                    href={createLocaleHref("/login")} 
                    onClick={() => setShowMobileMenu(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                      isActive("/login")
                        ? "bg-yellow-600 text-black"
                        : "text-gray-300 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    {t('navigation.login')}
                  </Link>
                  <Link
                    href={createLocaleHref("/register")}
                    onClick={() => setShowMobileMenu(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                      isActive("/register")
                        ? "bg-yellow-600 text-black"
                        : "text-gray-300 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    {t('navigation.register')}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}