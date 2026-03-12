/**
 * Profile Picture Display Component
 * Shows user profile picture with fallback to placeholder
 * Features: Lazy loading, error handling, loading states
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { getProfilePictureUrl } from '@/lib/profilePictureUtils';

interface ProfilePictureDisplayProps {
  displayName: string;
  userId: string;
  profilePicture?: any;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showBorder?: boolean;
  onClick?: () => void;
}

const sizeConfig = {
  small: { width: 40, height: 40, className: 'w-10 h-10' },
  medium: { width: 150, height: 150, className: 'w-[150px] h-[150px]' },
  large: { width: 300, height: 300, className: 'w-[300px] h-[300px]' },
};

export function ProfilePictureDisplay({
  displayName,
  userId,
  profilePicture,
  size = 'medium',
  className = '',
  showBorder = true,
  onClick,
}: ProfilePictureDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const config = sizeConfig[size];
  const sizeMap = { small: 'thumbnail', medium: 'medium', large: 'medium' } as const;
  const pictureUrl = getProfilePictureUrl(profilePicture, sizeMap[size]);

  const borderClass = showBorder ? 'border-2 border-gray-300' : '';
  const defaultClass = `${config.className} ${borderClass} rounded-full object-cover bg-gray-100 ${className}`;

  // Lazy loading with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-full ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    >
      {isLoading && isInView && (
        <div className={`${config.className} bg-gray-200 animate-pulse rounded-full`} />
      )}

      {isInView && (
        <img
          ref={imgRef}
          src={pictureUrl}
          alt={displayName}
          width={config.width}
          height={config.height}
          className={defaultClass}
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setImageError(true);
            setIsLoading(false);
          }}
        />
      )}

      {imageError && (
        <div className={`${config.className} bg-gray-300 flex items-center justify-center rounded-full`}>
          <span className="text-gray-600 font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {!isInView && (
        <div className={`${config.className} bg-gray-200 rounded-full`} />
      )}
    </div>
  );
}

export default ProfilePictureDisplay;
