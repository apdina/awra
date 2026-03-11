"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNotification } from '@/app/contexts/NotificationContext';
import { useAuth } from '@/components/ConvexAuthProvider';
import { useTranslationsFromPath } from '@/i18n/translation-context';

const RegisterPageContent = () => {
  const router = useRouter();
  const { addNotification } = useNotification();
  const { register: registerUser } = useAuth();
  const { t, locale } = useTranslationsFromPath();
  const [formData, setFormData] = useState<{
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    agreedToTerms: boolean;
  }>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const validateForm = () => {
    let isValid = true;
    const errors: Record<string, string> = {};

    if (formData.username.length < 3) {
      errors.username = t('auth.register.validation.username_min_length');
      isValid = false;
    }

    if (!formData.email.includes("@")) {
      errors.email = t('auth.register.validation.email_invalid');
      isValid = false;
    }

    // Password validation - must match backend requirements
    if (formData.password.length < 8) {
      errors.password = t('auth.register.validation.password_min_length');
      isValid = false;
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = t('auth.register.validation.password_uppercase');
      isValid = false;
    } else if (!/[a-z]/.test(formData.password)) {
      errors.password = t('auth.register.validation.password_lowercase');
      isValid = false;
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password = t('auth.register.validation.password_number');
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('auth.register.validation.passwords_not_match');
      isValid = false;
    }

    if (!formData.agreedToTerms) {
      setError(t('auth.register.must_agree_terms'));
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    if (!validateForm()) {
      setError(t('auth.register.fix_errors_below'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await registerUser(formData.email, formData.password, formData.username);

      if (response.success) {
        setSuccess(true);
        addNotification({ type: 'success', message: t('auth.register.account_created_success') });
        
        setTimeout(() => {
          addNotification({ 
            type: 'success', 
            message: '🎉 Welcome! You received 100Ɐ bonus to start playing!' 
          });
        }, 500);
        
        // Redirect to home page since user is auto-logged in
        setTimeout(() => {
          router.push(`/${locale}`);
        }, 1500);
      } else {
        setError(response.error || t('auth.register.registration_failed'));
        addNotification({ type: 'error', message: response.error || t('auth.register.registration_failed') });
      }
    } catch (err: any) {
      const errorMessage = err.message || t('auth.register.registration_failed_message');
      setError(errorMessage);
      addNotification({ type: 'error', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (error) setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center justify-center gap-3">
              <span className="text-yellow-400">Ɐ</span>
              {t('auth.register.create_account')}
            </h2>
            <p className="text-gray-300 mb-8">{t('auth.register.join_community')}</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2 min-h-[2.5rem] flex items-end">
                {t('auth.register.choose_username')}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={isLoading || success}
                className={`mt-1 block w-full px-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200
                  ${validationErrors.username ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-yellow-500 focus:border-yellow-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder={t('auth.register.choose_username')}
              />
              {validationErrors.username && (
                <p className="mt-1 text-xs text-red-400 animate-in slide-in-from-top duration-200">{validationErrors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2 min-h-[2.5rem] flex items-end">
                {t('auth.register.email_address')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading || success}
                className="mt-1 block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="you@example.com"
              />
              {validationErrors.email && (
                <p className="mt-1 text-xs text-red-400 animate-in slide-in-from-top duration-200">{validationErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                {t('auth.register.password')} *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading || success}
                  className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${
                    validationErrors.password ? 'border-red-500' : 'border-gray-600'
                  } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                  placeholder="•••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A3 3 0 0010.875 15.825H4.5a3 3 0 00-3 3v-6.75M7.5 15.825a3 3 0 003 3v6.75m3-6.75a3 3 0 00-3 3v6.75M9 12.75a3 3 0 00-3 3v1.5m3 0a3 3 0 003 3v-1.5m-3 0a3 3 0 00-3 3v1.5m6 6.75a3 3 0 003 3v-6.75" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-2 text-sm text-red-400">
                  {validationErrors.password}
                </p>
              )}
              
              {/* Password Requirements */}
              <div className="mt-2 space-y-1 text-xs text-gray-400">
                <div className={`flex items-center gap-1 ${formData.password.length >= 8 ? 'text-green-400' : 'text-gray-500'}`}>
                  <span className={formData.password.length >= 8 ? '✅' : '○'}>{t('auth.register.validation.requirement_min_length')}</span>
                </div>
                <div className={`flex items-center gap-1 ${/[A-Z]/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}`}>
                  <span className={/[A-Z]/.test(formData.password) ? '✅' : '○'}>{t('auth.register.validation.requirement_uppercase')}</span>
                </div>
                <div className={`flex items-center gap-1 ${/[a-z]/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}`}>
                  <span className={/[a-z]/.test(formData.password) ? '✅' : '○'}>{t('auth.register.validation.requirement_lowercase')}</span>
                </div>
                <div className={`flex items-center gap-1 ${/[0-9]/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}`}>
                  <span className={/[0-9]/.test(formData.password) ? '✅' : '○'}>{t('auth.register.validation.requirement_number')}</span>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                {t('auth.register.confirm_password')} *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={isLoading || success}
                  className={`w-full px-4 py-3 bg-white/10 border ${
                    validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                  } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                  placeholder="•••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? (
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
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400 animate-in slide-in-from-top duration-200">{validationErrors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Submit */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={formData?.agreedToTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
                disabled={isLoading || success}
                className="h-4 w-4 rounded border-gray-600 bg-gray-700/50 text-yellow-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-300">
                {t('auth.register.i_agree')} <a href="#" className="text-yellow-400 hover:text-yellow-300 underline">{t('auth.register.terms_of_service')}</a>
              </label>
            </div>

            {error && (
              <div className="text-center p-3 rounded bg-red-500/20 border border-red-500 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full py-3 px-4 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold text-lg rounded-lg shadow-lg hover:shadow-yellow-500/25 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018 8v4a8 8 0 014 0m0 0a8 8 0 008 8v4a8 8 0 018 8z" />
                  </svg>
                  {t('auth.register.creating_account')}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  {t('auth.register.create_account')}
                </>
              )}
            </button>
          </form>

          {success && (
            <div className="text-center mt-6 p-4 bg-green-500/20 border border-green-500 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-2">{t('auth.register.success')}</h3>
              <p className="text-green-200">{t('auth.register.account_created_success')}</p>
              <p className="text-sm text-green-300 mt-2">{t('auth.register.redirecting')}</p>
            </div>
          )}

          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              {t('auth.register.have_account.title')} {" "}
              <Link href={`/${locale}/login`} className="font-medium text-yellow-400 hover:text-yellow-300 transition-colors text-sm">
                {t('auth.login.sign_in')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function RegisterPage() {
  return <RegisterPageContent />;
}
