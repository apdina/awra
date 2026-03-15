"use client";

import { useState, useEffect } from "react";
import { X, Play, CheckCircle, Lock, MessageCircle } from "lucide-react";
import { useAuth } from "@/components/ConvexAuthProvider";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { logger } from '@/lib/logger';

type VideoAdReason = "avatar" | "chat";

// Helper function to ensure type safety
const isChatReason = (reason?: VideoAdReason): reason is "chat" => {
  return reason === "chat";
};

interface VideoAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAvatar?: string; // Optional: Which special avatar user wants to unlock
  reason?: VideoAdReason; // Why the modal is being shown
  onChatSuccess?: () => void; // Callback for chat message success
}

export default function VideoAdModal({ 
  isOpen, 
  onClose,
  selectedAvatar,
  reason = "avatar",
  onChatSuccess
}: VideoAdModalProps) {
  const { user: authUser } = useAuth();
  const [watchedPercentage, setWatchedPercentage] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [watchSessionId, setWatchSessionId] = useState<string | null>(null);
  
  const completeVideoWatch = useMutation(api.videoAds.completeVideoWatch);
  const completeChatVideoWatch = useMutation(api.videoAds.completeChatVideoWatch);
  const startVideoWatch = useMutation(api.videoAds.startVideoWatch);
  const canWatchVideo = useQuery(api.videoAds.canWatchVideo);
  const videoStats = useQuery(api.videoAds.getVideoStats);

  const handleStartWatching = async () => {
    if (!authUser) return;

    try {
      setError(null);
      const result = await startVideoWatch({
        userId: authUser._id,
        adProvider: "placeholder", // Will be replaced with real platform when available
        adUnitId: isChatReason(reason) ? "chat_message_unlock" : "special_avatar_unlock",
        videoId: `video_${Date.now()}_${authUser._id}`, // Unique video identifier
      });
      
      setWatchSessionId(result.watchId);
      setIsWatching(true);
      logger.log("Video watch session started:", result);
    } catch (err) {
      setError("Failed to start video. Please try again.");
      logger.error("Failed to start video watch:", err);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setWatchedPercentage(0);
      setIsCompleted(false);
      setError(null);
      setIsWatching(false);
      setWatchSessionId(null);
    } else if (isOpen && !isWatching && !watchSessionId) {
      // Auto-start video when modal opens
      handleStartWatching();
    }
  }, [isOpen]);

  // Simulate video progress (placeholder for real video player)
  useEffect(() => {
    if (!isWatching || isCompleted) return;

    const interval = setInterval(() => {
      setWatchedPercentage(prev => {
        // Complete in ~3 seconds (about 33% per second)
        const newPercentage = prev + 35;
        if (newPercentage >= 100) {
          setIsCompleted(true);
          setIsWatching(false);
          return 100;
        }
        return newPercentage;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isWatching, isCompleted]);

  const handleCompleteVideo = async () => {
    console.log("[VideoAdModal] handleCompleteVideo CLICKED!");
    if (!watchSessionId || !authUser) {
      console.error("[VideoAdModal] Missing watchSessionId or authUser", { watchSessionId, authUser });
      return;
    }

    try {
      setError(null);
      console.log("[VideoAdModal] Starting video completion, watchId:", watchSessionId, "reason:", reason);
      
      let result;
      
      if (isChatReason(reason)) {
        console.log("[VideoAdModal] Processing as chat reward");
        // For chat, use the dedicated chat video completion function
        result = await completeChatVideoWatch({
          userId: authUser._id,
          watchId: watchSessionId as any,
          watchDuration: 3, // Demo: 3 seconds
          completionRate: 100, // 100% completion for placeholder
        });

        console.log("[VideoAdModal] completeChatVideoWatch result:", result);

        if (result.success) {
          console.log("[VideoAdModal] Chat video completion successful, calling onChatSuccess");
          // Small delay to ensure database update propagates
          await new Promise(resolve => setTimeout(resolve, 1000));
          onChatSuccess?.(); // Call chat success callback
          setTimeout(() => {
            console.log("[VideoAdModal] Closing modal");
            onClose();
          }, 1500); // Show success message for 1.5 seconds
        } else {
          throw new Error("Chat video completion failed");
        }
      } else {
        // For avatar unlocking
        if (!selectedAvatar) return;
        
        result = await completeVideoWatch({
          userId: authUser._id,
          watchId: watchSessionId as any,
          watchDuration: 30, // Minimum 30 seconds
          completionRate: 100, // 100% completion for placeholder
          selectedAvatar: selectedAvatar, // The specific avatar user selected
        });

        if (result.success) {
          setTimeout(() => {
            onClose();
          }, 2000); // Show success message for 2 seconds
        }
      }
      
      logger.log("Video completed successfully:", result);
    } catch (err: any) {
      console.error("[VideoAdModal] Failed to complete video:", err);
      setError("Failed to complete video. Please try again.");
      logger.error("Failed to complete video watch:", err);
    }
  };

  if (!isOpen) return null;

  const hasSpecialAvatarAccess = videoStats?.hasSpecialAvatarAccess || false;

  // Debug: Log authentication state
  console.log('VideoAdModal - isOpen:', isOpen);
  console.log('VideoAdModal - authUser:', authUser);
  console.log('VideoAdModal - canWatchVideo:', canWatchVideo);
  console.log('VideoAdModal - reason:', reason);

  // Simple check: if user is logged in, they can watch (for chat reason)
  // For avatar reason, check the canWatchVideo query
  const canWatch = isChatReason(reason) 
    ? !!authUser  // For chat, just check if user is authenticated
    : (!!authUser && canWatchVideo?.canWatch);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 relative z-[10000]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-[10001]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">
            {isChatReason(reason) 
              ? "Message Limit Reached!" 
              : hasSpecialAvatarAccess 
                ? "Special Avatars Unlocked!" 
                : `Unlock ${selectedAvatar ? selectedAvatar.toUpperCase() : 'Special Avatar'}`
            }
          </h3>
          <p className="text-gray-300 text-sm">
            {isChatReason(reason) 
              ? "Watch a short video to continue chatting"
              : hasSpecialAvatarAccess 
                ? "You already have access to all special avatars!"
                : selectedAvatar 
                  ? `Watch a short video to unlock the ${selectedAvatar.toUpperCase()} avatar`
                  : "Watch a short video to unlock special avatars"
            }
          </p>
        </div>

        {/* Status Display */}
        {isChatReason(reason) ? (
          <>
            <div className="text-center py-4">
              <MessageCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <p className="text-blue-400 font-medium">Continue the conversation!</p>
              <p className="text-gray-400 text-sm mt-2">Watch a video to send more messages</p>
            </div>
            
            {/* Video Player Placeholder - For Chat Reason */}
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                {!isWatching ? (
                  <div className="text-center">
                    <Play className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                    <p className="text-gray-300 text-sm">Click to start watching</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-300 text-sm">Video playing...</p>
                  </div>
                )}

                {/* Progress Bar - Chat Section */}
                {isWatching && (
                  <>
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-800 h-2">
                      <div 
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${watchedPercentage}%` }}
                      />
                    </div>
                    {/* Skip/Close X Button */}
                    <button
                      onClick={() => {
                        setIsWatching(false);
                        setWatchedPercentage(0);
                        onClose();
                      }}
                      className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-800 text-gray-400 hover:text-white p-1.5 rounded-full transition-colors z-10"
                      title="Skip video"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Debug Info */}
            <div className="text-xs text-gray-500 text-center mb-2">
              Debug: isWatching={isWatching ? 'yes' : 'no'}, isCompleted={isCompleted ? 'yes' : 'no'}, watchId={watchSessionId || 'none'}
            </div>

            {/* Action Buttons - For Chat Reason */}
            <div className="space-y-3">
              {!isWatching && !isCompleted && (
                <button
                  onClick={handleStartWatching}
                  disabled={!canWatch}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {canWatch ? (
                    <>
                      <Play className="w-4 h-4" />
                      Start Watching (3 seconds)
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      {!authUser ? "Login required" : "Not available"}
                    </>
                  )}
                </button>
              )}

              {isCompleted && (
                <button
                  onClick={async () => {
                    console.log("[VideoAdModal] BUTTON CLICKED!");
                    try {
                      await handleCompleteVideo();
                    } catch (err: any) {
                      console.error("[VideoAdModal] Button click error:", err);
                      setError("Click failed: " + (err.message || "Unknown error"));
                    }
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Continue Chatting
                </button>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Info Text */}
              <div className="text-center text-xs text-gray-400">
                {isWatching && "Watch for 3 seconds to continue chatting"}
                {isCompleted && "Click to send your message!"}
                {!isWatching && !isCompleted && "Demo video - 3 seconds"}
              </div>
            </div>
          </>
        ) : hasSpecialAvatarAccess ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-green-400 font-medium">Special avatars are now available!</p>
            <p className="text-gray-400 text-sm mt-2">Check your avatar selector</p>
          </div>
        ) : (
          <>
            {/* Video Player Placeholder */}
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                {!isWatching ? (
                  <div className="text-center">
                    <Play className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                    <p className="text-gray-300 text-sm">Click to start watching</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-300 text-sm">Video playing...</p>
                  </div>
                )}

                {/* Progress Bar - Avatar Section */}
                {isWatching && (
                  <>
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-800 h-2">
                      <div 
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${watchedPercentage}%` }}
                      />
                    </div>
                    {/* Skip/Close X Button */}
                    <button
                      onClick={() => {
                        setIsWatching(false);
                        setWatchedPercentage(0);
                        onClose();
                      }}
                      className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-800 text-gray-400 hover:text-white p-1.5 rounded-full transition-colors z-10"
                      title="Skip video"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!isWatching && !isCompleted && (
                <button
                  onClick={handleStartWatching}
                  disabled={!canWatch}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {canWatch ? (
                    <>
                      <Play className="w-4 h-4" />
                      Start Watching (3 seconds)
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      {!authUser ? "Login required" : hasSpecialAvatarAccess ? "Already unlocked" : "Not available"}
                    </>
                  )}
                </button>
              )}

              {isCompleted && (
                <button
                  onClick={handleCompleteVideo}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isChatReason(reason) ? "Continue Chatting" : `Unlock ${selectedAvatar ? selectedAvatar.toUpperCase() : 'Special Avatar'}`}
                </button>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Info Text */}
              <div className="text-center text-xs text-gray-400">
                {isWatching && "Watch for 3 seconds to unlock special avatars"}
                {isCompleted && "Click to claim your reward!"}
                {!isWatching && !isCompleted && "Demo video - 3 seconds"}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
