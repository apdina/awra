"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Check } from "lucide-react";

interface AvatarSelectorProps {
  currentAvatarName?: string;
  currentAvatarType?: 'basic' | 'special';
  onSelect: (avatarName: string, avatarType: 'basic' | 'special') => void;
  className?: string;
}

export default function AvatarSelector({
  currentAvatarName,
  currentAvatarType,
  onSelect,
  className = "",
}: AvatarSelectorProps) {
  const avatars = useQuery(api.avatar.getAvailableAvatars);
  const [selectedTab, setSelectedTab] = useState<'basic' | 'special'>('basic');

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

  const displayAvatars = selectedTab === 'basic' ? avatars.basic : avatars.special;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setSelectedTab('basic')}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === 'basic'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Basic Avatars ({avatars.basic.length})
        </button>
        <button
          onClick={() => setSelectedTab('special')}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === 'special'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Special Avatars ({avatars.special.length})
        </button>
      </div>

      {/* Avatar Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {displayAvatars.map((avatar) => (
          <button
            key={avatar.name}
            onClick={() => onSelect(avatar.name, avatar.type)}
            className={`relative group rounded-lg overflow-hidden transition-all ${
              isSelected(avatar.name, avatar.type)
                ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800'
                : 'hover:ring-2 hover:ring-gray-500'
            }`}
            title={avatar.description}
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
            {isSelected(avatar.name, avatar.type) && (
              <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-1">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors" />
          </button>
        ))}
      </div>

      {/* Info Text */}
      <p className="text-sm text-gray-400 text-center">
        {selectedTab === 'basic' 
          ? 'Choose from our collection of basic avatars'
          : 'Special avatars for unique personalities'}
      </p>
    </div>
  );
}
