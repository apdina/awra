/**
 * Profile Picture Upload Component
 * Handles uploading and managing profile pictures
 */

'use client';

import React, { useState, useRef } from 'react';
import { validateImageFile, formatFileSize } from '@/lib/profilePictureUtils';
import { logger } from '@/lib/logger';
import ProfilePictureDisplay from './ProfilePictureDisplay';

interface ProfilePictureUploadProps {
  displayName: string;
  userId: string;
  currentProfilePicture?: any;
  onUploadSuccess?: (data: any) => void;
  onUploadError?: (error: string) => void;
  onDelete?: () => void;
}

export function ProfilePictureUpload({
  displayName,
  userId,
  currentProfilePicture,
  onUploadSuccess,
  onUploadError,
  onDelete,
}: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Reset states
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    // Validate file
    const validation = validateImageFile(file, 5);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      onUploadError?.(validation.error || 'Invalid file');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);  // Add userId to form data

      const response = await fetch('/api/user/profile-picture/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'x-user-id': userId,  // Also in header
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      setSuccess('Profile picture uploaded successfully');
      onUploadSuccess?.(data.data);

      logger.log('✅ Profile picture uploaded successfully');

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Upload failed';
      setError(errorMessage);
      onUploadError?.(errorMessage);

      logger.error('Profile picture upload error:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/user/profile-picture/delete', {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      setSuccess('Profile picture deleted successfully');
      onDelete?.();

      logger.log('✅ Profile picture deleted successfully');
    } catch (err: any) {
      const errorMessage = err.message || 'Delete failed';
      setError(errorMessage);

      logger.error('Profile picture delete error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const isPersonalPicture = currentProfilePicture?.type === 'personal';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Profile Picture Display */}
      <div className="relative">
        <ProfilePictureDisplay
          displayName={displayName}
          userId={userId}
          profilePicture={currentProfilePicture}
          size="large"
          onClick={handleClick}
        />

        {/* Upload Overlay */}
        <button
          onClick={handleClick}
          disabled={isUploading}
          className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-full p-2 transition-colors"
          title="Upload profile picture"
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

      {/* Upload Progress */}
      {isUploading && (
        <div className="w-full max-w-xs">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 text-center mt-2">Uploading...</p>
        </div>
      )}

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
        <p>Click the camera icon to upload a new picture</p>
        <p className="text-xs text-gray-500 mt-1">
          JPG, PNG, or WebP • Max 1MB
        </p>
      </div>

      {/* Delete Button */}
      {isPersonalPicture && (
        <button
          onClick={handleDelete}
          disabled={isUploading}
          className="text-red-600 hover:text-red-700 disabled:text-gray-400 text-sm font-medium transition-colors"
        >
          Delete Picture
        </button>
      )}

      {/* Picture Type Info */}
      {currentProfilePicture && (
        <div className="text-xs text-gray-500 text-center">
          {currentProfilePicture.type === 'personal' && (
            <p>📸 Personal picture</p>
          )}
          {currentProfilePicture.type === 'oauth' && (
            <p>🔗 Picture from {currentProfilePicture.oauthProvider}</p>
          )}
          {currentProfilePicture.type === 'placeholder' && (
            <p>🎨 Default placeholder</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfilePictureUpload;
