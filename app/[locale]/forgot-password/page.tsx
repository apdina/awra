"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslationsFromPath } from '@/i18n/translation-context';
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { locale } = useTranslationsFromPath();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [devToken, setDevToken] = useState("");
  const [devLink, setDevLink] = useState("");

  const requestResetMutation = useMutation(api.passwordReset.requestPasswordReset);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setDevToken("");
    setDevLink("");

    try {
      const result = await requestResetMutation({ email });
      
      if (result.success) {
        setSuccess(true);
        
        // Show dev token in development
        if (result.devToken) {
          setDevToken(result.devToken);
        }
        if (result.devLink) {
          setDevLink(result.devLink);
        }
        
        // Redirect to login after showing success message (only if not in dev mode)
        if (!result.devToken) {
          setTimeout(() => {
            router.push(`/${locale}/login`);
          }, 5000);
        }
      } else {
        setError("Failed to send reset instructions. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <div className="max-w-md w-full space-y-8 animate-in fade-in duration-500">
          <div className={`bg-gray-800/95 backdrop-blur-sm rounded-xl p-8 border transition-all duration-500 ${
            success ? 'border-green-500/50 shadow-lg shadow-green-500/20' : 
            error ? 'border-red-500/50 shadow-lg shadow-red-500/20' : 
            'border-gray-700 shadow-xl'
          }`}>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Reset Password
              </h3>
              <p className="text-sm text-gray-400">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
            </div>
            
            {!success ? (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="mt-1 block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    placeholder="Enter your email address"
                  />
                </div>

                {error && (
                  <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 animate-in slide-in-from-top duration-300">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-red-400 text-sm font-medium">Error</p>
                        <p className="text-red-300 text-sm mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-black bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <span className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Sending...</span>
                      </span>
                    ) : (
                      "Send Reset Instructions"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Check Your Email</h4>
                  <p className="text-gray-400 mb-4">
                    If an account exists with that email, we've sent password reset instructions.
                  </p>
                  {!devToken && (
                    <p className="text-sm text-gray-500">
                      Redirecting to login page...
                    </p>
                  )}
                </div>

                {/* Development mode - show token and link */}
                {devToken && (
                  <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm font-medium mb-2">Development Mode</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Reset Token:</p>
                        <code className="text-xs text-yellow-300 bg-gray-900/50 p-2 rounded block break-all">
                          {devToken}
                        </code>
                      </div>
                      {devLink && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Reset Link:</p>
                          <a 
                            href={devLink}
                            className="text-xs text-yellow-300 hover:text-yellow-200 underline break-all block"
                          >
                            {devLink}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-center pt-4 border-t border-gray-700 mt-6">
              <Link
                href={`/${locale}/login`}
                className="font-medium text-yellow-500 hover:text-yellow-400 transition-colors text-sm"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
