"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/ConvexAuthProvider";
import { useTranslationsFromPath } from '@/i18n/translation-context';

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { t, locale } = useTranslationsFromPath();
  const redirectUrl = searchParams.get('redirect') || `/${locale}`;
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await login(formData.email, formData.password);

      if (response.success) {
        console.log("🎉 Login successful");
        setSuccess(true);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        router.push(redirectUrl);
      } else {
        // Handle specific error cases
        const errorMsg = response.error || t('auth.login.login_failed_message');
        console.error('❌ Login failed:', errorMsg);
        setError(errorMsg);
        
        // Clear password field on error for security
        setFormData(prev => ({ ...prev, password: "" }));
      }
    } catch (err: any) {
      const errorMessage = err.message || t('auth.login.login_failed_message');
      console.error('❌ Login error:', err);
      setError(errorMessage);
      
      // Clear password field on error for security
      setFormData(prev => ({ ...prev, password: "" }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <div className="max-w-md w-full space-y-8 animate-in fade-in duration-500">
          <div className={`bg-gray-800/95 backdrop-blur-sm rounded-xl p-8 border transition-all duration-500
 ${                                                                                                                     success ? 'border-green-500/50 shadow-lg shadow-green-500/20' : 
            error ? 'border-red-500/50 shadow-lg shadow-red-500/20' : 
            'border-gray-700 shadow-xl'
          }`}>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                {t('auth.login.welcome_back')}
              </h3>
              <p className="text-sm text-gray-400">{t('auth.login.sign_in_to_account')}</p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    {t('auth.login.email_address')}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading || success}
                    className={`mt-1 block w-full px-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200
                      ${fieldErrors.email || error ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-yellow-500 focus:border-yellow-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder={t('auth.login.enter_your_email')}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    {t('auth.login.password')}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading || success}
                      className={`mt-1 block w-full px-4 py-3 pr-12 bg-gray-700/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200
                        ${fieldErrors.password || error ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-yellow-500 focus:border-yellow-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                      placeholder={t('auth.login.enter_your_password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
                      disabled={isLoading || success}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className={`border rounded-lg p-4 animate-in slide-in-from-top duration-300 ${
                  error.includes('locked') || error.includes('banned') 
                    ? 'bg-orange-900/30 border-orange-500/50' 
                    : 'bg-red-900/30 border-red-500/50'
                }`}>
                  <div className="flex items-start space-x-3">
                    <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      error.includes('locked') || error.includes('banned') 
                        ? 'text-orange-400' 
                        : 'text-red-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {error.includes('locked') ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                      )}
                    </svg>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        error.includes('locked') || error.includes('banned') 
                          ? 'text-orange-400' 
                          : 'text-red-400'
                      }`}>
                        {error.includes('locked') ? 'Account Locked' : 
                         error.includes('banned') ? 'Account Banned' :
                         error.includes('reset') ? 'Password Reset Required' :
                         t('auth.login.login_failed')}
                      </p>
                      <p className={`text-sm mt-1 ${
                        error.includes('locked') || error.includes('banned') 
                          ? 'text-orange-300' 
                          : 'text-red-300'
                      }`}>{error}</p>
                      {error.includes('reset') && (
                        <Link 
                          href={`/${locale}/forgot-password`}
                          className="inline-block mt-2 text-sm text-yellow-500 hover:text-yellow-400 font-medium"
                        >
                          Reset Password →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 animate-in slide-in-from-top duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-green-400 text-sm font-medium">{t('auth.login.success_redirecting')}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    href={`/${locale}/forgot-password`}
                    className="text-yellow-500 hover:text-yellow-400 transition-colors font-medium"
                  >
                    {t('auth.login.forgot_password')}
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || success}
                  className="w-full relative flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-black bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <span className="flex items-center space-x-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{t('auth.login.signing_in')}</span>
                    </span>
                  ) : success ? (
                    <span className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{t('auth.login.signed_in')}</span>
                    </span>
                  ) : (
                    t('auth.login.sign_in')
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-gray-400 text-sm">{t('auth.login.no_account')} </span>
                <Link
                  href={`/${locale}/register`}
                  className="font-medium text-yellow-500 hover:text-yellow-400 transition-colors text-sm"
                >
                  {t('auth.login.create_one')}
                </Link>
              </div>
            </form>
          </div>

          <div className="text-center text-xs text-gray-500">
            {locale === 'es' ? 'Al iniciar sesión, aceptas nuestros ' : 
             locale === 'it' ? 'Accedendo, accetti i nostri ' :
             locale === 'nl-NL' ? 'Door in te loggen, ga je akkoord met onze ' :
             'By signing in, you agree to our '}
            <Link href={`/${locale}/terms`} className="text-yellow-500 hover:text-yellow-400 transition-colors">
              {t('auth.login.terms_of_service')}
            </Link>
            {locale === 'es' ? ' y ' : 
             locale === 'it' ? ' e ' :
             locale === 'nl-NL' ? ' en ' :
             ' and '}
            <Link href={`/${locale}/privacy`} className="text-yellow-500 hover:text-yellow-400 transition-colors">
              {t('auth.login.privacy_policy')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
