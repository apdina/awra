'use client';

import React, { useRef, useState } from 'react';
import { useAuth } from '@/components/ConvexAuthProvider';
import { logger } from '@/lib/logger';
import { useTranslationsFromPath } from '@/i18n/translation-context';
import { validatePhotoSecurity } from '@/lib/photoSecurityUtils';

interface SimplePhotoUploadProps {
  onUploadSuccess?: () => void;
  onDelete?: () => void;
}

export function SimplePhotoUpload({
  onUploadSuccess,
  onDelete,
}: SimplePhotoUploadProps) {
  const { user, updateProfile } = useAuth();
  const { t } = useTranslationsFromPath();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [localPhoto, setLocalPhoto] = useState<string | null>(user?.userPhoto || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Reset states
    setError(null);
    setSuccess(null);

    // Validate file
    if (file.size > 1024 * 1024) {
      setError(t('account.profile.photo_requirements'));
      return;
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.type)) {
      setError(t('account.profile.photo_requirements'));
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;

          // Validate photo security (magic bytes, dimensions, size)
          const securityCheck = await validatePhotoSecurity(base64, 1024 * 1024, 2000, 2000);
          
          if (!securityCheck.valid) {
            const errorMessage = securityCheck.errors.join('; ');
            setError(errorMessage);
            logger.error('Photo security validation failed:', securityCheck.errors);
            setIsUploading(false);
            return;
          }

          logger.log(`✅ Photo validated: ${securityCheck.format} (${securityCheck.width}x${securityCheck.height})`);

          // Update user profile with photo
          const result = await updateProfile({
            userPhoto: base64,
            usePhoto: true,
          });

          if (result.success) {
            setSuccess(t('account.profile.photo_uploaded_successfully'));
            setLocalPhoto(base64); // Update local state
            onUploadSuccess?.();
            logger.log('✅ Photo uploaded successfully');
          } else {
            setError(result.error || 'Upload failed');
          }

          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (err: any) {
          setError(err.message || 'Upload failed');
          logger.error('Photo upload error:', err);
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setIsUploading(false);
      logger.error('Photo upload error:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('account.profile.confirm_delete_photo'))) {
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateProfile({
        userPhoto: '', // Empty string to signal deletion
        usePhoto: false,
      });

      if (result.success) {
        setSuccess(t('account.profile.photo_deleted_successfully'));
        setLocalPhoto(null); // Clear local photo state immediately
        onDelete?.();
        logger.log('✅ Photo deleted successfully');
      } else {
        setError(result.error || 'Delete failed');
      }
    } catch (err: any) {
      setError(err.message || 'Delete failed');
      logger.error('Photo delete error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const hasPhoto = !!localPhoto;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Photo Display */}
      <div className="relative">
        {hasPhoto ? (
          <img
            src={localPhoto}
            alt="Your photo"
            className="w-[150px] h-[150px] rounded-full object-cover border-2 border-gray-300"
          />
        ) : (
          <div className="w-[150px] h-[150px] rounded-full bg-gray-300 flex items-center justify-center border-2 border-gray-300">
            <span className="text-gray-600 font-semibold text-2xl">
              {user?.displayName?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleClick}
          disabled={isUploading}
          className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-full p-2 transition-colors"
          title="Upload photo"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-xs bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="w-full max-w-xs bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Info Text */}
      <div className="text-center text-sm text-gray-600">
        <p>{t('account.profile.click_camera_icon')}</p>
        <p className="text-xs text-gray-500 mt-1">
          {t('account.profile.photo_requirements')}
        </p>
      </div>

      {/* Delete Button */}
      {hasPhoto && (
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={isUploading}
            className="text-red-600 hover:text-red-700 disabled:text-gray-400 text-sm font-medium transition-colors"
          >
            {t('account.profile.delete_photo')}
          </button>
          <button
            onClick={async () => {
              setIsUploading(true);
              try {
                const result = await updateProfile({
                  usePhoto: true,
                });
                if (result.success) {
                  setSuccess(t('account.profile.photo_activated'));
                  onUploadSuccess?.();
                  logger.log('✅ Photo activated');
                } else {
                  setError(result.error || t('account.profile.failed_to_activate_photo'));
                }
              } catch (err: any) {
                setError(err.message || t('account.profile.failed_to_activate_photo'));
              } finally {
                setIsUploading(false);
              }
            }}
            disabled={isUploading}
            className="text-green-600 hover:text-green-700 disabled:text-gray-400 text-sm font-medium transition-colors"
          >
            {t('account.profile.use_photo_button')}
          </button>
        </div>
      )}
    </div>
  );
}

export default SimplePhotoUpload;
