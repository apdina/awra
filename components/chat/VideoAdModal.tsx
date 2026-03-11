"use client";

import { useState, useEffect } from "react";
import { X, Play, CheckCircle } from "lucide-react";
import { useAuth } from "@/components/ConvexAuthProvider";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { logger } from '@/lib/logger';

interface VideoAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReward: (coinsEarned: number) => void;
}

export default function VideoAdModal({ 
  isOpen, 
  onClose, 
  onReward 
}: VideoAdModalProps) {
  const { user: authUser } = useAuth();
  const [watchedPercentage, setWatchedPercentage] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const completeVideoWatch = useMutation(api.videoAds.completeVideoWatch);

  useEffect(() => {
    if (!isOpen) {
      setWatchedPercentage(0);
      setIsCompleted(false);
      setError(null);
    }
  }, [isOpen]);

  // Simulate video progress (in real app, this would be based on actual video playback)
  useEffect(() => {
    if (isOpen && !isCompleted) {
      const interval = setInterval(() => {
        setWatchedPercentage((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsCompleted(true);
            return 100;
          }
          return prev + 2; // 2% every 100ms = 5 second video
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isOpen, isCompleted]);

  const handleCompleteVideo = async () => {
    if (!authUser?._id) {
      setError("Please log in to watch videos and earn coins");
      return;
    }

    try {
      const result = await completeVideoWatch({
        completionRate: 100,
        adProvider: "custom",
        videoId: "chat-message-reward",
      });

      if (result.success) {
        onReward(result.coinsEarned);
        onClose();
      } else {
        setError(result.message || "Failed to complete video");
      }
    } catch (error: any) {
      logger.error("Failed to complete video:", error);
      setError(error.message || "Failed to complete video");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-white" />
            <h3 className="text-white font-semibold">Watch Video Ad</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Container */}
        <div className="relative bg-black aspect-video flex items-center justify-center">
          {isCompleted ? (
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Video Completed!</h4>
              <p className="text-green-400 font-semibold">You earned 20 coins!</p>
            </div>
          ) : (
            <>
              {/* Simulated video content */}
              <div className="text-center text-slate-400">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Video Ad Placeholder</p>
                <p className="text-sm mt-2">Watch to earn 20 coins</p>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
                  style={{ width: `${watchedPercentage}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4">
          {error && (
            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {isCompleted ? (
            <button
              onClick={handleCompleteVideo}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Claim 20 Coins
            </button>
          ) : (
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Watch video to earn 20 coins</span>
              <span>{watchedPercentage}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
