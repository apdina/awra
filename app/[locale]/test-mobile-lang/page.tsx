"use client";

import { useState } from 'react';
import { LanguageSwitcher } from '@/app/components/ui/LanguageSwitcher';
import { usePathname } from 'next/navigation';

export default function TestMobileLangPage() {
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] || 'es';
  const [testClicks, setTestClicks] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Mobile Language Switcher Test</h1>
        
        {/* Test the language switcher component */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-yellow-400">Language Switcher</h2>
          <div className="flex justify-center">
            <LanguageSwitcher currentLocale={currentLocale} />
          </div>
        </div>

        {/* Current state info */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-yellow-400">Current State</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Current Locale:</span>
              <span className="ml-2 font-semibold text-white">{currentLocale}</span>
            </div>
            <div>
              <span className="text-gray-400">Current Path:</span>
              <span className="ml-2 font-mono text-xs bg-gray-700 px-2 py-1 rounded">{pathname}</span>
            </div>
            <div>
              <span className="text-gray-400">User Agent:</span>
              <span className="ml-2 text-xs text-gray-300 break-all">
                {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        {/* Test interactions */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-yellow-400">Test Interactions</h2>
          <button
            onClick={() => setTestClicks(prev => prev + 1)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-3 transition-colors"
          >
            Test Click ({testClicks})
          </button>
          <p className="text-xs text-gray-400">
            This button tests if touch interactions work properly on mobile devices.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2 text-blue-400">Testing Instructions</h3>
          <ol className="list-decimal list-inside space-y-1 text-xs text-gray-300">
            <li>Tap the language switcher button above</li>
            <li>The dropdown should appear with language options</li>
            <li>Tap a different language to switch</li>
            <li>The page should reload with the new language</li>
            <li>Test on different mobile devices and browsers</li>
          </ol>
        </div>

        {/* Device info */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold mb-2 text-yellow-400">Device Info</h3>
          <div className="space-y-1 text-xs text-gray-300">
            <div>
              <span className="text-gray-400">Screen:</span>
              <span className="ml-2">
                {typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'Loading...'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Viewport:</span>
              <span className="ml-2">
                {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Loading...'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Touch Support:</span>
              <span className="ml-2">
                {typeof window !== 'undefined' ? ('ontouchstart' in window ? 'Yes' : 'No') : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}