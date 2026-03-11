"use client";

import { useState, useEffect } from "react";
import { Clock, RefreshCw } from "lucide-react";
import { useTranslationsFromPath } from '@/i18n/translation-context';

interface CountdownData {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
  nextDrawDate?: string;
  nextDrawTime?: string;
  dayOfWeek?: string;
}

// Global event for countdown refresh
let countdownRefreshListeners: (() => void)[] = [];

export const triggerCountdownRefresh = () => {
  countdownRefreshListeners.forEach(listener => listener());
};

export default function SimpleCountdown() {
  const { t } = useTranslationsFromPath();
  const [countdown, setCountdown] = useState<CountdownData>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    isExpired: false
  });
  const [isLoading, setIsLoading] = useState(false);

  // Simple countdown calculation from server data
  const updateCountdown = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      const url = forceRefresh ? '/api/countdown?t=' + Date.now() : '/api/countdown';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setCountdown(data.data);
      }
    } catch (error) {
      console.error('Error fetching countdown:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize countdown
  useEffect(() => {
    updateCountdown();
  }, []);

  // Listen for manual refresh triggers
  useEffect(() => {
    const handleRefresh = () => {
      updateCountdown(true); // Force refresh with cache busting
    };
    
    countdownRefreshListeners.push(handleRefresh);
    
    return () => {
      const index = countdownRefreshListeners.indexOf(handleRefresh);
      if (index > -1) {
        countdownRefreshListeners.splice(index, 1);
      }
    };
  }, []);

  // Update every second for smooth countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev.totalSeconds <= 0) {
          return prev; // Let server handle expired state
        }
        
        const newTotalSeconds = Math.max(0, prev.totalSeconds - 1);
        const hrs = Math.floor(newTotalSeconds / 3600);
        const mins = Math.floor((newTotalSeconds % 3600) / 60);
        const secs = newTotalSeconds % 60;
        
        return {
          ...prev,
          hours: hrs,
          minutes: mins,
          seconds: secs,
          totalSeconds: newTotalSeconds,
          isExpired: newTotalSeconds <= 0
        };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Refresh from server every 30 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      updateCountdown();
    }, 30000); // 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  // Translate day of week
  const translateDayOfWeek = (day: string): string => {
    const dayMap: { [key: string]: string } = {
      'Monday': t('days.monday'),
      'Tuesday': t('days.tuesday'),
      'Wednesday': t('days.wednesday'),
      'Thursday': t('days.thursday'),
      'Friday': t('days.friday'),
      'Saturday': t('days.saturday'),
      'Sunday': t('days.sunday'),
    };
    return dayMap[day] || day;
  };

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Clock className="w-6 h-6 text-yellow-400" />
        <h2 className="text-white font-bold text-lg">{t('home.next_draw')}</h2>
        {isLoading && (
          <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin ml-2" />
        )}
        <button
          onClick={() => updateCountdown(true)}
          className="ml-2 p-1 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
          title="Refresh countdown"
        >
          <RefreshCw className="w-4 h-4 text-yellow-300" />
        </button>
      </div>
      
      {countdown.nextDrawDate && (
        <div className="text-center mb-4">
          <p className="text-yellow-300 text-sm font-semibold">
            {translateDayOfWeek(countdown.dayOfWeek || '')} • {countdown.nextDrawDate} {t('home.at')} {countdown.nextDrawTime}
          </p>
        </div>
      )}
      
      <div className="flex justify-center gap-3">
        <div className="bg-slate-900/50 rounded-lg px-4 py-3 text-center flex-1">
          <div className="text-yellow-400 font-bold text-2xl">{formatNumber(countdown.hours)}</div>
          <div className="text-slate-300 text-xs mt-1">{t('home.hours')}</div>
        </div>
        <div className="bg-slate-900/50 rounded-lg px-4 py-3 text-center flex-1">
          <div className="text-yellow-400 font-bold text-2xl">{formatNumber(countdown.minutes)}</div>
          <div className="text-slate-300 text-xs mt-1">{t('home.minutes')}</div>
        </div>
        <div className="bg-slate-900/50 rounded-lg px-4 py-3 text-center flex-1">
          <div className="text-yellow-400 font-bold text-2xl">{formatNumber(countdown.seconds)}</div>
          <div className="text-slate-300 text-xs mt-1">{t('home.seconds')}</div>
        </div>
      </div>
      
      {countdown.isExpired && (
        <div className="text-center mt-4">
          <p className="text-yellow-300 text-sm font-semibold animate-pulse">
            {t('home.draw_in')} {t('common.loading')}
          </p>
        </div>
      )}
    </div>
  );
}
