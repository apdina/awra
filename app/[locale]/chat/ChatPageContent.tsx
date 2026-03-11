"use client";

import { useState, useEffect } from "react";
import ChatContainer from "@/components/chat/chat-container";
import { ChatProvider } from "@/components/chat/chat-provider";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTranslation } from '@/i18n/translation-context';
import { useAuth } from "@/components/ConvexAuthProvider";
import Link from "next/link";
import { MessageCircle, Users, Trophy } from "lucide-react";
import PageWithSidebarAds from "@/components/layout/PageWithSidebarAds";
import { getCsrfToken } from "@/lib/csrf-client";

interface ChatPageContentProps {
  locale: string;
}

export default function ChatPageContent({ locale }: ChatPageContentProps) {
  const [currentRoomId, setCurrentRoomId] = useState("room_vip"); // Default to VIP room
  const { t } = useTranslation();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Removed duplicate queries - data comes from ChatContainer now
  const isLoading = authLoading;

  // Join chat room when user is authenticated
  useEffect(() => {
    if (isAuthenticated && authUser?._id) {
      const setPresence = async () => {
        try {
          const csrfToken = await getCsrfToken();
          await fetch('/api/chat/join-room', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({ roomId: currentRoomId, userId: authUser._id }),
          });
        } catch (error) {
          console.warn('Failed to join chat room:', error);
        }
      };
      setPresence();
    }

    // Cleanup: set presence to offline when leaving
    return () => {
      if (isAuthenticated && authUser?._id) {
        const leaveRoom = async () => {
          try {
            const csrfToken = await getCsrfToken();
            await fetch('/api/chat/leave-room', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
              },
              body: JSON.stringify({ roomId: currentRoomId, userId: authUser._id }),
            });
          } catch (error) {
            console.warn('Failed to leave chat room:', error);
          }
        };
        leaveRoom();
      }
    };
  }, [isAuthenticated, authUser?._id, currentRoomId]);

  return (
    <ChatProvider>
      <PageWithSidebarAds>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Header */}
        <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-3">
            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {t('home.live_game_chat')}
                  </h1>
                  <p className="text-xs text-slate-400">
                    Join the conversation
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-lg">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-400">Loading...</span>
                  </div>
                ) : isAuthenticated && authUser ? (
                  <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-white font-medium">
                      {authUser.displayName || 'Player'}
                    </span>
                    {authUser?.isAdmin && (
                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold ml-1">
                        Admin
                      </span>
                    )}
                  </div>
                ) : (
                  <Link
                    href={`/${locale}/login`}
                    className="px-4 py-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-semibold rounded-lg transition-all duration-200 text-sm"
                  >
                    Login to Chat
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-base font-bold text-white">
                    {t('home.live_game_chat')}
                  </h1>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isLoading ? (
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                  ) : isAuthenticated && authUser ? (
                    <div className="flex items-center gap-1.5 bg-slate-700/50 px-2 py-1 rounded-lg">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-white font-medium truncate max-w-[80px]">
                        {authUser.displayName || 'Player'}
                      </span>
                    </div>
                  ) : (
                    <Link
                      href={`/${locale}/login`}
                      className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold rounded-lg text-xs"
                    >
                      Login
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 py-6">
          {/* Chat Container */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="h-[500px]">
              <ChatContainer roomId={currentRoomId} onRoomChange={setCurrentRoomId} />
            </div>
          </div>
          
          {/* Chat Rules */}
          <div className="mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              {t('chat.guidelines_title')}
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{t('chat.guideline_1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{t('chat.guideline_2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{t('chat.guideline_3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{t('chat.guideline_4')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{t('chat.guideline_5')}</span>
              </li>
            </ul>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-slate-800/50 backdrop-blur-sm border-t border-slate-700 mt-8">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-400">
                <span className="text-green-500">●</span> Live chat active
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-400">
                <a href={`/${locale}/terms`} className="hover:text-white transition-colors">Terms</a>
                <a href={`/${locale}/privacy`} className="hover:text-white transition-colors">Privacy</a>
                <a href={`/${locale}/responsible-gambling`} className="hover:text-white transition-colors">Responsible Gambling</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
      </PageWithSidebarAds>
    </ChatProvider>
  );
}
