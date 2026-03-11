"use client";

import Link from "next/link";
import { useAuth } from "@/components/ConvexAuthProvider";
import { Navigation } from "@/app/components/ui/Navigation";
import { useTranslationsFromPath } from '@/i18n/translation-context';

export default function ResponsibleGamblingPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { locale } = useTranslationsFromPath();
  
  // Map Convex User to game User type
  const gameUser = user ? {
    id: user._id,
    username: user.displayName,
    email: user.email || '',
    awra_coins: user.coinBalance,
    is_verified: true, // Convex users are verified by default
    is_active: user.isActive,
    role: user.isAdmin ? 'ADMIN' as const : 'USER' as const,
  } : undefined;
  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation
        isAuthenticated={isAuthenticated}
        user={gameUser}
        session={null}
        onLogout={() => {}} onNavigateHome={function (): void {
          throw new Error("Function not implemented.");
        } }      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Responsible Gambling</h1>
          <p className="text-xl text-gray-400">Play responsibly and stay in control</p>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">⚠️</div>
            <div>
              <h3 className="text-lg font-bold text-red-400 mb-2">Gambling can be addictive</h3>
              <p className="text-red-300">
                Please gamble responsibly. If you or someone you know has a gambling problem, seek help immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Age Verification */}
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 mb-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🔞</div>
            <h2 className="text-2xl font-bold text-white mb-4">Age Restriction</h2>
            <p className="text-gray-400 mb-6">
              You must be 18 years or older to participate in AWRA lottery games.
              By continuing to use this site, you confirm that you are of legal age.
            </p>
            <div className="bg-yellow-600 text-black px-6 py-3 rounded-lg font-bold inline-block">
              Age Verified: 18+
            </div>
          </div>
        </div>

        {/* Responsible Gambling Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-yellow-500 mb-4">🎯 Play Within Your Means</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start space-x-3">
                <span className="text-yellow-500 mt-1">💰</span>
                <span>Set a budget and stick to it</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-yellow-500 mt-1">⏰</span>
                <span>Only spend money you can afford to lose</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-yellow-500 mt-1">📊</span>
                <span>Track your spending and wins/losses</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-yellow-500 mt-1">🚫</span>
                <span>Don't chase losses</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-yellow-500 mb-4">🛡️ Stay in Control</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start space-x-3">
                <span className="text-yellow-500 mt-1">⏱️</span>
                <span>Take regular breaks from playing</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-yellow-500 mt-1">🎯</span>
                <span>Set time limits for gaming sessions</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-yellow-500 mt-1">📱</span>
                <span>Avoid playing when stressed or tired</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-yellow-500 mt-1">👥</span>
                <span>Talk to friends and family about your habits</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Self-Assessment */}
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">🔍 Self-Assessment</h3>
          <p className="text-gray-400 mb-6 text-center">
            Ask yourself these questions to assess your gambling habits:
          </p>

          <div className="space-y-4">
            {[
              "Do you gamble more than you intended to?",
              "Have you tried to cut down or stop gambling but couldn't?",
              "Do you feel restless or irritable when trying to cut down on gambling?",
              "Do you gamble to escape problems or feelings?",
              "Do you lie to family or friends about how much you gamble?",
              "Have you ever committed a crime to finance gambling?",
              "Have you ever borrowed money to gamble?",
              "Do you feel guilty about your gambling?"
            ].map((question, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
                <div className="text-yellow-500 font-bold text-lg">{index + 1}.</div>
                <div className="text-gray-300">{question}</div>
                <div className="flex space-x-2 ml-auto">
                  <button className="w-8 h-8 rounded-full border-2 border-gray-600 bg-gray-800 hover:bg-green-600 transition-colors"></button>
                  <span className="text-gray-500 text-sm">Yes</span>
                  <button className="w-8 h-8 rounded-full border-2 border-gray-600 bg-gray-800 hover:bg-red-600 transition-colors"></button>
                  <span className="text-gray-500 text-sm">No</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <p className="text-gray-400 mb-4">
              If you answered "Yes" to 4 or more questions, you may have a gambling problem.
            </p>
            <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-bold transition-colors">
              Get Help Now
            </button>
          </div>
        </div>

        {/* Help Resources */}
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">🆘 Help & Support</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-yellow-500">International Resources</h4>

              <div className="space-y-3">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="font-bold text-white">Gamblers Anonymous</div>
                  <div className="text-gray-400 text-sm">24/7 support meetings worldwide</div>
                  <div className="text-blue-400 mt-2">gamblersanonymous.org</div>
                </div>

                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="font-bold text-white">National Council on Problem Gambling</div>
                  <div className="text-gray-400 text-sm">Resources and helplines</div>
                  <div className="text-blue-400 mt-2">ncpgambling.org</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-bold text-yellow-500">Emergency Contacts</h4>

              <div className="space-y-3">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="font-bold text-white">Crisis Hotline</div>
                  <div className="text-gray-400 text-sm">24/7 confidential support</div>
                  <div className="text-red-400 mt-2 font-bold">1-800-123-4567</div>
                </div>

                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="font-bold text-white">Suicide Prevention</div>
                  <div className="text-gray-400 text-sm">If you're in crisis</div>
                  <div className="text-red-400 mt-2 font-bold">988 (US)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Controls */}
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">🎮 Account Controls</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-700 rounded-lg">
              <div className="text-4xl mb-4">⏰</div>
              <h4 className="text-lg font-bold text-white mb-2">Time Limits</h4>
              <p className="text-gray-400 mb-4">Set daily or weekly time limits</p>
              <button className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded font-bold transition-colors">
                Set Limit
              </button>
            </div>

            <div className="text-center p-6 bg-gray-700 rounded-lg">
              <div className="text-4xl mb-4">💸</div>
              <h4 className="text-lg font-bold text-white mb-2">Deposit Limits</h4>
              <p className="text-gray-400 mb-4">Limit how much you can deposit</p>
              <button className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded font-bold transition-colors">
                Set Limit
              </button>
            </div>

            <div className="text-center p-6 bg-gray-700 rounded-lg">
              <div className="text-4xl mb-4">🚫</div>
              <h4 className="text-lg font-bold text-white mb-2">Self-Exclusion</h4>
              <p className="text-gray-400 mb-4">Temporarily or permanently exclude yourself</p>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold transition-colors">
                Exclude Me
              </button>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center bg-gray-800 rounded-xl p-8 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Remember: Gambling Should Be Fun</h3>
          <p className="text-gray-400 mb-6">
            Gambling is entertainment, not a way to make money. Play responsibly and know when to stop.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/${locale}/`}
              className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-3 rounded font-bold transition-colors"
            >
              Back to Game
            </Link>
            <Link
              href={`/${locale}/account`}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded font-bold transition-colors"
            >
              My Account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}