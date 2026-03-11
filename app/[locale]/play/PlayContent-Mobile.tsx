"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/ConvexAuthProvider";
import { useTranslations } from '@/i18n/utils';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { useTranslationsFromPath } from '@/i18n/translation-context';
import { Trash2 } from 'lucide-react';

interface BetLine {
  id: string;
  number: number;
  amount: number;
}

export default function PlayContentMobile() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useTranslationsFromPath();
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const t = useTranslations(locale);

  // State
  const [betLines, setBetLines] = useState<BetLine[]>([]);
  const [inputRows, setInputRows] = useState<Array<{ number: string; amount: string }>>(
    Array(8).fill(null).map(() => ({ number: '', amount: '' }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Load data on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedBetLines = localStorage.getItem('mobileBetLines');
      if (savedBetLines) {
        setBetLines(JSON.parse(savedBetLines));
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      if (betLines.length > 0) {
        localStorage.setItem('mobileBetLines', JSON.stringify(betLines));
      } else {
        localStorage.removeItem('mobileBetLines');
      }
    }
  }, [betLines, isMounted]);

  const addBetLine = useCallback((number: number, amount: number) => {
    if (!number || number < 1 || number > 200) {
      setError(t('play.mobile.invalid_number'));
      return;
    }

    if (!amount || amount <= 0) {
      setError(t('play.mobile.invalid_amount'));
      return;
    }

    // Check if number already exists
    if (betLines.some(line => line.number === number)) {
      setError(t('play.mobile.number_exists'));
      return;
    }

    const newLine: BetLine = {
      id: Date.now().toString(),
      number,
      amount
    };

    setBetLines(prev => [...prev, newLine]);
    setError("");
  }, [betLines, t]);

  const calculateTotalBet = useCallback(() => {
    return inputRows.reduce((sum, row) => {
      const amount = parseInt(row.amount) || 0;
      return sum + amount;
    }, 0);
  }, [inputRows]);

  const handleInputChange = (index: number, field: 'number' | 'amount', value: string) => {
    // Prevent decimal input for amount field
    if (field === 'amount' && (value.includes('.') || value.includes(','))) {
      setError(t('play.mobile.invalid_amount'));
      // Clear the error after 3 seconds
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    setInputRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setError("");
  };

  const clearAll = useCallback(() => {
    setBetLines([]);
    setInputRows(Array(8).fill(null).map(() => ({ number: '', amount: '' })));
    setError("");
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mobileBetLines');
    }
  }, []);

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      router.push(`/${locale}/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check for incomplete rows (only number or only price filled)
    for (let i = 0; i < inputRows.length; i++) {
      const row = inputRows[i];
      const hasNumber = row.number && row.number.trim() !== '';
      const hasAmount = row.amount && row.amount.trim() !== '';

      // If only one field is filled, show error
      if (hasNumber && !hasAmount) {
        setError(t('play.mobile.incomplete_bet_missing_price'));
        return;
      }
      if (hasAmount && !hasNumber) {
        setError(t('play.mobile.incomplete_bet_missing_number'));
        return;
      }
    }

    // Collect filled rows (both number and amount present)
    const filledRows = inputRows.filter(row => row.number && row.amount);

    if (filledRows.length === 0) {
      setError(t('play.mobile.add_at_least_one'));
      return;
    }

    // Validate all filled rows
    for (const row of filledRows) {
      const number = parseInt(row.number);
      const amount = parseInt(row.amount);

      if (number < 1 || number > 200) {
        setError(t('play.mobile.invalid_number'));
        return;
      }

      if (amount <= 0) {
        setError(t('play.mobile.invalid_amount'));
        return;
      }
    }

    const totalBet = calculateTotalBet();
    if (totalBet > (user.coinBalance || 0)) {
      setError(t('play.insufficient_balance'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      // Simple fetch with just credentials (HTTP-only cookies handle auth)
      const unifiedBets = filledRows.map(row => ({
        number: parseInt(row.number),
        amount: parseInt(row.amount)
      }));

      const response = await fetch('/api/tickets/unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include HTTP-only cookies
        body: JSON.stringify({ bets: unifiedBets })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific error codes
        if (response.status === 401) {
          setError(t('play.mobile.auth_error'));
          // Redirect to login after a delay
          setTimeout(() => {
            router.push(`/${locale}/login?redirect=${encodeURIComponent(pathname)}`);
          }, 2000);
          return;
        }
        
        if (response.status === 500) {
          setError(t('play.mobile.server_error'));
          return;
        }
        
        // Default error message
        setError(t('play.mobile.ticket_creation_failed'));
        return;
      }

      await refreshUser();

      if (typeof window !== 'undefined') {
        localStorage.removeItem('mobileBetLines');
      }

      router.push(`/${locale}/tickets`);
    } catch (err: any) {
      // Network error
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError(t('play.mobile.network_error'));
      } else {
        setError(t('play.mobile.ticket_creation_failed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">{t('play.title')}</h1>
            <div className="text-sm text-gray-300">
              {t('navigation.balance')}: <CurrencyDisplay amount={user?.coinBalance || 0} showDecimals />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col">
          {/* Error Display */}
          {error && (
            <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Input Table */}
          <div className="mb-0">
            <div className="space-y-0">
              {/* Header */}
              <div className="flex gap-4 px-4 py-2 bg-gray-700 rounded-t-lg">
                <div className="flex-1 text-gray-300 font-semibold text-sm">{t('home.numbers')}</div>
                <div className="w-20 text-right text-gray-300 font-semibold text-sm">{t('play.bet_placeholder')}</div>
              </div>

              {/* Input Rows */}
              <div className="bg-gray-800 overflow-hidden">
                {inputRows.map((row, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 px-3 py-2 items-center ${
                      idx !== inputRows.length - 1 ? 'border-b border-gray-700' : ''
                    }`}
                  >
                    <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs font-semibold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={row.number}
                      onChange={(e) => handleInputChange(idx, 'number', e.target.value)}
                      className="flex-1 bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none text-sm"
                    />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={row.amount}
                      onChange={(e) => handleInputChange(idx, 'amount', e.target.value)}
                      className="w-16 bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none text-sm text-right"
                    />
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex gap-4 px-4 py-3 bg-gray-700 font-semibold">
                <div className="flex-1 text-gray-300">{t('play.mobile.total')}</div>
                <div className="w-20 text-right text-lg">
                  <span className="text-yellow-400">Ɐ</span><span className="text-yellow-300 ml-1">{calculateTotalBet()}</span>
                </div>
              </div>

              {/* Create Ticket Button */}
              <Button
                onClick={handleSubmit}
                disabled={inputRows.every(row => !row.number || !row.amount) || isSubmitting}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 disabled:bg-gray-600 rounded-b-lg text-white font-semibold py-3"
              >
                {isSubmitting ? t('play.mobile.creating') : t('play.mobile.create_ticket')}
              </Button>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-gray-800 border-t border-gray-700 px-4 py-3 flex gap-2">
          {inputRows.some(row => row.number || row.amount) && (
            <Button
              onClick={clearAll}
              className="flex-1 bg-gray-600 hover:bg-gray-700 rounded-lg"
            >
              {t('play.clear_all')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
