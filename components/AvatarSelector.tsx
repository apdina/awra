"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Check, Lock, Play } from "lucide-react";
import SimplePhotoUpload from "@/app/[locale]/components/SimplePhotoUpload";
import { useTranslationsFromPath } from "@/i18n/translation-context";
import VideoAdModal from "@/components/account/VideoAdModal";
import { useAuth } from "@/components/ConvexAuthProvider";

interface AvatarSelectorProps {
  currentAvatarName?: string;
  currentAvatarType?: 'basic' | 'special' | 'photo';
  usePhoto?: boolean;
  userPhoto?: string;
  onSelect: (avatarName: string, avatarType: 'basic' | 'special') => void;
  onPhotoUpload?: () => void;
  className?: string;
}

export default function AvatarSelector({
  currentAvatarName,
  currentAvatarType,
  usePhoto,
  userPhoto,
  onSelect,
  onPhotoUpload,
  className = "",
}: AvatarSelectorProps) {
  const avatars = useQuery(api.avatar.getAvailableAvatars);
  const videoStats = useQuery(api.videoAds.getVideoStats);
  const { user: authUser } = useAuth();
  const { t } = useTranslationsFromPath();
  
  // All hooks must be called at the top level
  const [selectedTab, setSelectedTab] = useState<'basic' | 'special' | 'photo'>(
    usePhoto ? 'photo' : 'basic'
  );
  const [showVideoAd, setShowVideoAd] = useState(false);
  const [selectedAvatarForAd, setSelectedAvatarForAd] = useState<string | null>(null);

  if (!avatars) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isSelected = (name: string, type: 'basic' | 'special') => {
    return currentAvatarName === name && currentAvatarType === type;
  };

  const isPhotoSelected = usePhoto;
  const hasSpecialAvatarAccess = videoStats?.hasSpecialAvatarAccess || false;
  const displayAvatars = selectedTab === 'basic' ? avatars.basic : avatars.special;

  const handleAvatarClick = (avatarName: string, avatarType: 'basic' | 'special') => {
    // For basic avatars, select directly
    if (avatarType === 'basic') {
      onSelect(avatarName, avatarType);
      return;
    }

    // For special avatars, check if user has access (watched video)
    if (hasSpecialAvatarAccess) {
      // User already has access - select the avatar
      onSelect(avatarName, avatarType);
    } else {
      // User needs to watch video first
      if (!authUser) {
        alert("Please login to unlock special avatars");
        return;
      }
      
      // Show video ad modal for this specific avatar
      setSelectedAvatarForAd(avatarName);
      setShowVideoAd(true);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700 flex-wrap">
        <button
          onClick={() => setSelectedTab('basic')}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === 'basic'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('account.profile.basic_avatars')} ({avatars.basic.length})
        </button>
        <button
          onClick={() => setSelectedTab('special')}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === 'special'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('account.profile.special_avatars')} ({avatars.special.length})
        </button>
        <button
          onClick={() => setSelectedTab('photo')}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === 'photo'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('account.profile.use_photo')}
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'photo' ? (
        // Photo Upload Section
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <SimplePhotoUpload
            onUploadSuccess={() => {
              onPhotoUpload?.();
            }}
            onDelete={() => {
              // User deleted photo, can go back to avatars
              setSelectedTab('basic');
            }}
          />
        </div>
      ) : (
        // Avatar Grid
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {displayAvatars.map((avatar) => {
            const isSpecialAvatar = avatar.type === 'special';
            const isLocked = isSpecialAvatar && !hasSpecialAvatarAccess;
            const isCurrentlySelected = isSelected(avatar.name, avatar.type);
            
            return (
              <div key={avatar.name} className="space-y-2">
                {/* Avatar Container */}
                <div
                  className={`relative group rounded-lg overflow-hidden transition-all ${
                    isCurrentlySelected
                      ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800'
                      : 'hover:ring-2 hover:ring-gray-500'
                  }`}
                >
                  {/* Avatar Image */}
                <div className="aspect-square bg-gray-700 flex items-center justify-center">
                  <img
                    src={avatar.imagePath}
                    alt={avatar.label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image doesn't exist
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                          ${avatar.name.charAt(0).toUpperCase()}
                        </div>
                      `;
                    }}
                  />
                </div>

                  {/* Selected Indicator */}
                  {isCurrentlySelected && (
                    <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* Special Avatar Badge */}
                  {isSpecialAvatar && !isLocked && (
                    <div className="absolute top-1 left-1 bg-purple-500 rounded-full p-1">
                      <span className="text-white text-xs font-bold">SP</span>
                    </div>
                  )}

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors" />
                </div>

                {/* Watch to Use Button for Locked Special Avatars */}
                {isLocked && (
                  <button
                    onClick={() => handleAvatarClick(avatar.name, avatar.type)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                    title={!authUser ? "Login required to unlock special avatars" : `Watch a video to unlock ${avatar.name}`}
                  >
                    <Play className="w-3 h-3" />
                    {!authUser ? "Login to use" : "Watch to use"}
                  </button>
                )}

                {/* Regular Selection for Unlocked Avatars */}
                {!isLocked && (
                  <button
                    onClick={() => handleAvatarClick(avatar.name, avatar.type)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                      isCurrentlySelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {isCurrentlySelected ? 'Selected' : 'Select'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info Text */}
      <p className="text-sm text-gray-400 text-center">
        {selectedTab === 'basic' 
          ? t('account.profile.choose_basic_avatars')
          : selectedTab === 'special'
          ? hasSpecialAvatarAccess 
            ? t('account.profile.choose_special_avatars')
            : authUser 
              ? "Watch a short video to unlock any special avatar"
              : "Login to unlock special avatars"
          : t('account.profile.upload_personal_photo')}
      </p>
      
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-yellow-400 text-center">
          Debug: User {authUser ? 'logged in' : 'not logged in'} | 
          Access: {hasSpecialAvatarAccess ? 'granted' : 'locked'}
        </div>
      )}

      {/* Video Ad Modal */}
      <VideoAdModal
        isOpen={showVideoAd}
        onClose={() => {
          setShowVideoAd(false);
          setSelectedAvatarForAd(null);
        }}
        selectedAvatar={selectedAvatarForAd || undefined}
      />
    </div>
  );
}
