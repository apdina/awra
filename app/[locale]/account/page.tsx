"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { formatDateDDMMYYYY } from "@/lib/dateUtils";
import { User, Session } from "@/types/game";
import { getCurrentUser } from "@/lib/api";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { useTranslationsFromPath } from "@/i18n/translation-context";
import { useAuth } from "@/components/ConvexAuthProvider";
import UserAvatar from "@/components/UserAvatar";
import AvatarSelector from "@/components/AvatarSelector";
import PageWithSidebarAds from "@/components/layout/PageWithSidebarAds";


export default function AccountPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const { t } = useTranslationsFromPath();
  const { user, isAuthenticated, logout, isLoading, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'balance'>('balance');
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isLoading, router, locale]);

  // Redirect if still loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      console.log("🚪 Account page logout initiated");
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdateMessage(null);

    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const updates = {
      displayName: formData.get('username') as string,
    };

    try {
      const result = await updateProfile(updates);

      if (result.success) {
        setUpdateMessage(t('account.profile.profile_updated'));
      } else {
        setUpdateMessage(result.error || t('account.profile.profile_update_error'));
      }
    } catch (error) {
      console.error("Update failed:", error);
      setUpdateMessage(t('account.profile.profile_update_error'));
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMessage(null);

    if (!currentPassword) {
      setUpdateMessage("Please enter your current password");
      return;
    }

    // Validate new password strength (must match backend requirements)
    if (!newPassword || newPassword.length < 8) {
      setUpdateMessage("New password must be at least 8 characters");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setUpdateMessage("Password must contain at least one uppercase letter");
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setUpdateMessage("Password must contain at least one lowercase letter");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setUpdateMessage("Password must contain at least one number");
      return;
    }

    if (newPassword !== confirmPassword) {
      setUpdateMessage("Passwords do not match");
      return;
    }

    setIsChangingPassword(true);

    try {
      console.log('🔐 Attempting password change...');
      const result = await changePassword(currentPassword, newPassword);
      console.log('Password change result:', result);
      
      if (result.success) {
        setUpdateMessage("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const errorMsg = result.error || "Failed to change password";
        console.error('Password change failed:', errorMsg);
        setUpdateMessage(errorMsg);
      }
    } catch (error) {
      console.error("Password change error:", error);
      setUpdateMessage("Failed to change password: " + (error as Error).message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarSelect = async (avatarName: string, avatarType: 'basic' | 'special') => {
    if (!user) return;
    
    setIsUpdatingAvatar(true);
    setUpdateMessage(null);

    try {
      const avatarUrl = `/avatars/${avatarType}/${avatarName}.png`;
      const result = await updateProfile({
        avatarName,
        avatarType,
        avatarUrl,
        usePhoto: false, // Disable photo when selecting avatar
      });

      if (result.success) {
        setUpdateMessage(t('account.profile.avatar_updated_successfully'));
        setShowAvatarSelector(false);
        setTimeout(() => setUpdateMessage(null), 3000);
      } else {
        setUpdateMessage(result.error || t('account.profile.failed_to_update_avatar'));
      }
    } catch (error) {
      console.error("Avatar update failed:", error);
      setUpdateMessage('Failed to update avatar');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="text-gray-400 mb-4">{t('account.loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageWithSidebarAds>
      <div className="min-h-screen bg-gray-900 text-white">
        <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{t('account.title')}</h1>
          <p className="text-gray-400 mt-2">{t('account.subtitle')}</p>
        </div>

        {/* Account Overview */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar user={user} size="xl" />
              <div>
                <h2 className="text-xl font-bold text-white">{user?.displayName || "User"}</h2>
                <p className="text-gray-400">{user?.email || "user@example.com"}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400 font-mono">
                <CurrencyDisplay amount={user?.coinBalance || 0} showDecimals />
              </div>
              <div className="text-gray-400 text-sm">{t('account.account_balance')}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'profile', label: t('account.tabs.profile'), icon: '👤' },
              { id: 'security', label: t('account.tabs.security'), icon: '🔒' },
              { id: 'balance', label: t('account.tabs.balance'), icon: '💰' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-yellow-500 text-yellow-500'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'profile' && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-6">{t('account.profile.title')}</h3>

              {/* Avatar Section */}
              <div className="mb-6 pb-6 border-b border-gray-700">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  {t('account.profile.profile_avatar')}
                </label>
                <div className="flex items-center gap-4">
                  <UserAvatar user={user} size="xl" />
                  <div className="flex-1">
                    <button
                      onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
                      disabled={isUpdatingAvatar}
                    >
                      {isUpdatingAvatar ? t('account.profile.updating') : t('account.profile.change_avatar')}
                    </button>
                    <p className="text-sm text-gray-400 mt-2">
                      {t('account.profile.choose_from_collection')}
                    </p>
                  </div>
                </div>

                {/* Avatar Selector */}
                {showAvatarSelector && (
                  <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <AvatarSelector
                      currentAvatarName={user?.avatarName}
                      currentAvatarType={user?.avatarType as 'basic' | 'special' | 'photo'}
                      usePhoto={user?.usePhoto}
                      userPhoto={user?.userPhoto}
                      onSelect={handleAvatarSelect}
                      onPhotoUpload={() => {
                        // Refresh user data after photo upload
                        setShowAvatarSelector(false);
                      }}
                    />
                  </div>
                )}
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('account.profile.username')}
                    </label>
                    <input
                      type="text"
                      name="username"
                      defaultValue={user?.displayName || ""}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('account.profile.email_address')}
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('account.profile.account_created')}
                  </label>
                  <div className="text-gray-400">
                    {user?.createdAt ? formatDateDDMMYYYY(new Date(user.createdAt)) : formatDateDDMMYYYY(new Date())}
                  </div>
                </div>

                {updateMessage && (
                  <div className={`p-3 rounded ${updateMessage.includes('Error') ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
                    {updateMessage}
                  </div>
                )}

                <div className="flex justify-end">
                  <button 
                    type="submit"
                    className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-2 rounded font-bold transition-colors"
                  >
                    {t('account.profile.save_changes')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-6">{t('account.security.title')}</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-bold text-white mb-3">{t('account.security.change_password')}</h4>
                  <form onSubmit={handleChangePassword} className="space-y-4" autoComplete="off">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('account.security.current_password')}
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          autoComplete="current-password"
                          className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 pr-10 text-white focus:border-yellow-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                          tabIndex={-1}
                        >
                          {showCurrentPassword ? (
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
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('account.security.new_password')}
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          autoComplete="new-password"
                          className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 pr-10 text-white focus:border-yellow-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                          tabIndex={-1}
                        >
                          {showNewPassword ? (
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
                      {newPassword && (
                        <div className="mt-2 space-y-1 text-sm">
                          <p className={newPassword.length >= 8 ? "text-green-400" : "text-gray-400"}>
                            {newPassword.length >= 8 ? "✓" : "○"} {t('account.security.requirement_min_length')}
                          </p>
                          <p className={/[A-Z]/.test(newPassword) ? "text-green-400" : "text-gray-400"}>
                            {/[A-Z]/.test(newPassword) ? "✓" : "○"} {t('account.security.requirement_uppercase')}
                          </p>
                          <p className={/[a-z]/.test(newPassword) ? "text-green-400" : "text-gray-400"}>
                            {/[a-z]/.test(newPassword) ? "✓" : "○"} {t('account.security.requirement_lowercase')}
                          </p>
                          <p className={/[0-9]/.test(newPassword) ? "text-green-400" : "text-gray-400"}>
                            {/[0-9]/.test(newPassword) ? "✓" : "○"} {t('account.security.requirement_number')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('account.security.confirm_new_password')}
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          className={`w-full bg-gray-700 border rounded-md px-3 py-2 pr-10 text-white focus:outline-none ${
                            confirmPassword && newPassword === confirmPassword
                              ? "border-green-500 focus:border-green-500"
                              : confirmPassword
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-600 focus:border-yellow-500"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                          tabIndex={-1}
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
                      {confirmPassword && newPassword === confirmPassword && (
                        <p className="text-green-400 text-sm mt-1">✓ Passwords match</p>
                      )}
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-red-400 text-sm mt-1">✗ Passwords do not match</p>
                      )}
                    </div>

                  <div className="flex justify-end mt-6">
                    <button
                      type="submit"
                      disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-2 rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isChangingPassword ? 'Changing...' : t('account.security.change_password')}
                    </button>
                  </div>

                  {updateMessage && (
                    <div className={`p-3 rounded text-sm ${
                      updateMessage.includes('successfully') 
                        ? 'bg-green-500/20 text-green-200 border border-green-500/50' 
                        : 'bg-red-500/20 text-red-200 border border-red-500/50'
                    }`}>
                      {updateMessage}
                    </div>
                  )}
                </form>
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h4 className="text-md font-bold text-red-400 mb-3">{t('account.security.danger_zone')}</h4>
                  <p className="text-gray-400 mb-4">
                    {t('account.security.danger_zone_desc')}
                  </p>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold transition-colors">
                    {t('account.security.delete_account')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'balance' && (
            <div className="space-y-6">
              {/* Current Balance */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">{t('account.balance.current_balance')}</h3>
                <div className="text-4xl font-bold text-green-400 font-mono mb-2">
                  <CurrencyDisplay amount={user?.coinBalance || 0} showDecimals />
                </div>
                <p className="text-gray-400">{t('account.balance.available_for_play')}</p>
              </div>

              {/* Watch Videos and Earn */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h4 className="text-md font-bold text-white mb-3">Watch Videos & Earn</h4>
                <p className="text-gray-400 mb-4">Watch short videos to earn coins and play more games</p>
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-bold transition-colors"
                >
                  Watch Videos Now
                </button>
              </div>


            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="mt-12 text-center">
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded font-bold transition-colors"
          >
            {t('account.logout')}
          </button>
          </div>
        </main>
      </div>
    </PageWithSidebarAds>
  );
}