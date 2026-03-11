"use client";

import { useState, useEffect, useRef } from "react";
import { X, Play, Loader2, CheckCircle2 } from "lucide-react";

interface RefreshVideoAdProps {
  onComplete: () => void;
}

/**
 * Simple Refresh Video Ad Component
 * Detects page refresh and shows a 15-second video ad
 */
export default function RefreshVideoAd({ onComplete }: RefreshVideoAdProps) {
  const [videoState, setVideoState] = useState<"loading" | "playing" | "completed">("loading");
  const [progress, setProgress] = useState(0);
  const [timeWatched, setTimeWatched] = useState(0);
  const [showAd, setShowAd] = useState(false);
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalDuration = 3; // 3 seconds

  // Check if this is a page refresh
  useEffect(() => {
    // Check for page refresh using navigation entries
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const isPageRefresh = navigationEntries.length > 0 && navigationEntries[0].type === 'reload';
    
    if (isPageRefresh) {
      setShowAd(true);
      initializeVideo();
    }
  }, []);

  const initializeVideo = () => {
    setVideoState("loading");
    setProgress(0);
    setTimeWatched(0);

    // Simulate video loading
    setTimeout(() => {
      setVideoState("playing");
      startProgressTracking();
    }, 1000);
  };

  const startProgressTracking = () => {
    progressIntervalRef.current = setInterval(() => {
      setTimeWatched((prev) => {
        const newTime = prev + 0.1;
        const newProgress = Math.min((newTime / totalDuration) * 100, 100);
        setProgress(newProgress);

        // Auto-complete at 100%
        if (newProgress >= 100 && videoState === "playing") {
          handleVideoComplete();
        }

        return newTime;
      });
    }, 100);
  };

  const handleVideoComplete = () => {
    setVideoState("completed");
    cleanup();
    
    // Auto-close after 2 seconds
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const handleClose = () => {
    cleanup();
    setShowAd(false);
    onComplete();
  };

  const cleanup = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Don't render if ad shouldn't show
  if (!showAd) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-lg mx-4 bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the modal itself
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-500">
          <div className="flex items-center gap-2 text-white">
            <Play className="w-5 h-5" />
            <h2 className="text-lg font-bold">Quick Video</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Video Container */}
        <div className="relative aspect-video bg-black">
          {/* Loading State */}
          {videoState === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-white text-sm">Loading video...</p>
            </div>
          )}

          {/* Playing State */}
          {videoState === "playing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
                  <Play className="w-12 h-12 text-blue-500" />
                </div>
                <p className="text-white text-lg font-semibold mb-2">Video Playing...</p>
                <p className="text-gray-400 text-sm">
                  {Math.floor(timeWatched)}s / {totalDuration}s
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md px-8">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center text-gray-400 text-xs mt-2">
                  {Math.floor(100 - progress)}% remaining
                </p>
              </div>
            </div>
          )}

          {/* Completed State */}
          {videoState === "completed" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-green-900 to-green-800">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-green-400" />
                </div>
                <h3 className="text-white text-2xl font-bold mb-2">Thank You!</h3>
                <p className="text-green-200 text-lg">Continuing to page...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-slate-800 text-center">
          <p className="text-gray-400 text-sm">
            💡 Please wait while video completes
          </p>
        </div>
      </div>
    </div>
  );
}
