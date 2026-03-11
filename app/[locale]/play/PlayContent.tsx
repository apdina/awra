"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/ConvexAuthProvider";
import { useTranslations } from '@/i18n/utils';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { logger } from '@/lib/logger';

import { Input } from "@/components/ui/input";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card";

import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { useTranslationsFromPath } from '@/i18n/translation-context';
import { useCurrentDrawShared } from '@/hooks/useCurrentDrawShared';

interface BetSelection {
  number: number;
  amount: number;
}

export default function PlayContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useTranslationsFromPath();
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();
  const t = useTranslations(locale);

  // Initialize state empty (Same on Server and Client)
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set());
  const [betAmounts, setBetAmounts] = useState<Map<number, number>>(new Map());
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentNumberInput, setCurrentNumberInput] = useState("");
  const [selectedNumberForBet, setSelectedNumberForBet] = useState<number | null>(null);
  const [currentBetInput, setCurrentBetInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [editingNumber, setEditingNumber] = useState<number | null>(null);
  const [editingNumberValue, setEditingNumberValue] = useState("");
  const [activeNumberSlot, setActiveNumberSlot] = useState<number | null>(null);
  const { draw: currentDraw } = useCurrentDrawShared();
  const [isLoadingDraw, setIsLoadingDraw] = useState(true);

  // Load data only on the client side, after mount
  useEffect(() => {
    setIsMounted(true);
    
    // Load from localStorage here
    try {
      const savedNumbers = localStorage.getItem('selectedNumbers');
      if (savedNumbers) {
        setSelectedNumbers(new Set(JSON.parse(savedNumbers)));
      }
      
      const savedBets = localStorage.getItem('betAmounts');
      if (savedBets) {
        setBetAmounts(new Map(JSON.parse(savedBets)));
      }
    } catch (error) {
      logger.error('Error loading from localStorage:', error);
    }
  }, []);

  // Save state to localStorage whenever it changes (only after mount)
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      if (selectedNumbers.size > 0) {
        localStorage.setItem('selectedNumbers', JSON.stringify(Array.from(selectedNumbers)));
      } else {
        localStorage.removeItem('selectedNumbers');
      }
    }
  }, [selectedNumbers, isMounted]);

  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      if (betAmounts.size > 0) {
        localStorage.setItem('betAmounts', JSON.stringify(Array.from(betAmounts.entries())));
      } else {
        localStorage.removeItem('betAmounts');
      }
    }
  }, [betAmounts, isMounted]);

  // Clear selections and localStorage when user logs out
  useEffect(() => {
    if (!isAuthenticated && isMounted) {
      setSelectedNumbers(new Set());
      setBetAmounts(new Map());
      setCurrentNumberInput("");
      setError("");
      setSelectedNumberForBet(null);
      setCurrentBetInput("");
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedNumbers');
        localStorage.removeItem('betAmounts');
      }
    }
  }, [isAuthenticated, isMounted]);

  // Update loading state based on shared hook
  useEffect(() => {
    if (currentDraw) {
      setIsLoadingDraw(false);
    }
  }, [currentDraw]);

  const handleBetAmountChange = useCallback((number: number, amount: string) => {
    const numAmount = parseInt(amount) || 0;
    
    // Handle placeholder numbers (negative indices)
    if (number < 0) {
      // Store bet amount for placeholder
      if (numAmount > 0) {
        setBetAmounts(prev => {
          const newMap = new Map(prev);
          newMap.set(number, numAmount);
          return newMap;
        });
      } else {
        setBetAmounts(prev => {
          const newMap = new Map(prev);
          newMap.delete(number);
          return newMap;
        });
      }
      return;
    }
    
    // Handle regular numbers
    setBetAmounts(prev => {
      const newMap = new Map(prev);
      if (numAmount > 0) {
        newMap.set(number, numAmount);
      } else {
        newMap.delete(number);
      }
      return newMap;
    });
  }, []);

  const handleKeypadPress = useCallback((key: string) => {
    // If we're entering a bet amount for a specific number
    if (selectedNumberForBet !== null) {
      if (key === 'C') {
        setCurrentBetInput("");
        return;
      }
      
      if (key === '←') {
        setCurrentBetInput(prev => prev.slice(0, -1));
        // Update bet amount when deleting
        const newInput = currentBetInput.slice(0, -1);
        handleBetAmountChange(selectedNumberForBet, newInput);
        return;
      }

      const newInput = currentBetInput + key;
      
      // Limit bet amount to reasonable values (max 9999)
      if (newInput.length <= 4) {
        const betAmount = parseInt(newInput);
        if (betAmount <= 9999) {
          setCurrentBetInput(newInput);
          // Auto-update the bet amount as user types
          handleBetAmountChange(selectedNumberForBet, newInput);
        }
      }
      return;
    }

    // Clear active slot when starting number input
    if (activeNumberSlot !== null) {
      setActiveNumberSlot(null);
    }

    // Original number input logic
    if (key === 'C') {
      setCurrentNumberInput("");
      return;
    }
    
    if (key === '←') {
      setCurrentNumberInput(prev => prev.slice(0, -1));
      return;
    }

    const newInput = currentNumberInput + key;

    // First digit validation
    if (newInput.length === 1) {
      const firstDigit = parseInt(key);
      if (firstDigit < 0 || firstDigit > 2) {
        return; // Invalid first digit
      }
    }

    // Auto-complete for numbers starting with 2
    if (newInput.length === 1 && key === '2') {
      const number = 200;
      setSelectedNumbers(prev => new Set([...prev, number]));
      setCurrentNumberInput("");
      return;
    }

    // Complete 3-digit number
    if (newInput.length === 3) {
      const number = parseInt(newInput);
      if (number >= 1 && number <= 200) {
        // Check if we're in placeholder bet mode
        if (selectedNumberForBet !== null && selectedNumberForBet < 0) {
          // Transfer the bet amount from placeholder to the actual number
          const betAmount = betAmounts.get(selectedNumberForBet);
          if (betAmount) {
            setBetAmounts(prev => {
              const newMap = new Map(prev);
              newMap.delete(selectedNumberForBet); // Remove placeholder
              newMap.set(number, betAmount); // Add to actual number
              return newMap;
            });
          }
          setSelectedNumberForBet(null);
          setCurrentBetInput("");
        }
        
        // Check if this number already exists and update it instead of adding duplicate
        if (selectedNumbers.has(number)) {
          setError(`Number ${number.toString().padStart(3, '0')} already exists`);
          setCurrentNumberInput("");
          return;
        }
        
        setSelectedNumbers(prev => new Set([...prev, number]));
        setCurrentNumberInput("");
        setError("");
      }
      return;
    }

    setCurrentNumberInput(newInput);
  }, [currentNumberInput, selectedNumberForBet, currentBetInput, handleBetAmountChange, activeNumberSlot, betAmounts]);

  const startBetEntry = useCallback((number: number) => {
    setSelectedNumberForBet(number);
    setCurrentBetInput(betAmounts.get(number)?.toString() || "");
    setCurrentNumberInput(""); // Clear number input when entering bet
  }, [betAmounts]);

  const finishBetEntry = useCallback(() => {
    if (selectedNumberForBet !== null && currentBetInput) {
      handleBetAmountChange(selectedNumberForBet, currentBetInput);
    }
    
    // If it's a placeholder (negative number), don't reset to number entry
    // Let user choose a number next
    if (selectedNumberForBet !== null && selectedNumberForBet >= 0) {
      setSelectedNumberForBet(null);
      setCurrentBetInput("");
    } else {
      // For placeholders, just clear the input but keep the slot selected
      setCurrentBetInput("");
    }
  }, [selectedNumberForBet, currentBetInput, handleBetAmountChange]);

  const calculateTotalBet = useCallback(() => {
    return Array.from(betAmounts.values()).reduce((sum, amount) => sum + amount, 0);
  }, [betAmounts]);

  const calculateTotalNumbers = useCallback(() => {
    return selectedNumbers.size;
  }, [selectedNumbers]);

  const handleNumberEdit = useCallback((number: number, newValue: string) => {
    const numValue = parseInt(newValue) || 0;
    if (numValue >= 1 && numValue <= 200) {
      setSelectedNumbers(prev => {
        const newSet = new Set(prev);
        newSet.delete(number); // Remove old number
        newSet.add(numValue); // Add new number
        return newSet;
      });
      
      // Transfer bet amount to new number
      setBetAmounts(prev => {
        const newMap = new Map(prev);
        const betAmount = newMap.get(number);
        if (betAmount) {
          newMap.delete(number);
          newMap.set(numValue, betAmount);
        }
        return newMap;
      });
      
      // Update selected number for bet if it was the old number
      if (selectedNumberForBet === number) {
        setSelectedNumberForBet(numValue);
      }
      
      // Sync screen input if this number is being edited
      if (editingNumber === number) {
        setCurrentNumberInput(numValue.toString());
      }
    }
  }, [selectedNumberForBet, editingNumber]);

  const startNumberEdit = useCallback((number: number) => {
    setEditingNumber(number);
    setEditingNumberValue(number.toString());
    // Sync screen input with the number being edited
    setCurrentNumberInput(number.toString());
    // Clear any bet entry when editing a number
    setSelectedNumberForBet(null);
    setCurrentBetInput("");
  }, []);

  const finishNumberEdit = useCallback(() => {
    if (editingNumber !== null && editingNumberValue) {
      handleNumberEdit(editingNumber, editingNumberValue);
    }
    setEditingNumber(null);
    setEditingNumberValue("");
    // Clear screen input after finishing edit
    setCurrentNumberInput("");
  }, [editingNumber, editingNumberValue, handleNumberEdit]);

  const handleSubmit = async () => {
    // Check if auth provider is still loading
    if (isLoading) {
      setError("Loading authentication, please wait...");
      return;
    }

    if (!isAuthenticated || !user) {
      logger.log('❌ User not authenticated, redirecting to login');
      logger.log('isAuthenticated:', isAuthenticated, 'user:', user);
      // If not authenticated, redirect to login
      router.push(`/${locale}/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    logger.log('✅ User authenticated, proceeding with ticket creation');
    logger.log('User:', user.displayName, 'Balance:', user.coinBalance);

    if (selectedNumbers.size === 0) {
      setError(t('play.select_at_least_one'));
      return;
    }

    const bets = Array.from(selectedNumbers).map(number => {
      const amount = betAmounts.get(number) || 0;
      if (amount <= 0) {
        setError(t('play.enter_bet_amount', { number: number.toString().padStart(3, '0') }));
        return null;
      }
      return {
        chosen_number: number,
        amount_awra_coins: amount
      };
    }).filter((bet): bet is { chosen_number: number; amount_awra_coins: number } => bet !== null);

    if (bets.length !== selectedNumbers.size) {
      return; // Error already set
    }

    if (calculateTotalBet() > (user?.coinBalance || 0)) {
      setError(t('play.insufficient_balance'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      // Transform bets to unified format
      const unifiedBets = bets.map(bet => ({
        number: bet.chosen_number,
        amount: bet.amount_awra_coins
      }));

      // Simple fetch with just credentials (HTTP-only cookies handle auth)
      const response = await fetch('/api/tickets/unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include HTTP-only cookies
        body: JSON.stringify({ 
          bets: unifiedBets
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ticket');
      }

      const ticket = await response.json();

      // Refresh user balance after successful ticket purchase
      await refreshUser();

      // Clear saved state after successful ticket creation
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedNumbers');
        localStorage.removeItem('betAmounts');
      }

      // Redirect to tickets page
      router.push(`/${locale}/tickets`);
    } catch (err: any) {
      setError(err.message || "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearAll = useCallback(() => {
    setSelectedNumbers(new Set());
    setBetAmounts(new Map());
    setCurrentNumberInput("");
    setError("");
    // Clear localStorage immediately
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedNumbers');
      localStorage.removeItem('betAmounts');
    }
  }, []);



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2">
            {t('play.title')}
          </h1>
          
          {/* Current Draw Info - Removed due to incorrect date display */}
        </div>

        {/* Number Input Section - Fixed Height with Scroll */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700 shadow-2xl pb-8">
          <div className="text-center mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">{t('play.select_numbers')}</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-3 md:space-y-4">
              {/* Compact Input Display */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border-2 border-gray-600 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-4 py-2 border-b border-gray-600">
                    <p className="text-blue-300 text-xs md:text-sm font-semibold text-center">
                      {selectedNumberForBet !== null 
                        ? selectedNumberForBet < 0 
                          ? `ENTER BET FOR SLOT #${Math.abs(selectedNumberForBet) + 1} - Press ✓ or Enter, then choose number` 
                          : `ENTER BET FOR #${selectedNumberForBet.toString().padStart(3, '0')} - Press ✓ or Enter when done` 
                        : "ENTER NUMBER (1-200) OR click bet field to start with amount"
                      }
                    </p>
                  </div>
                  <div className="p-4 md:p-6 min-h-[80px] flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl md:text-5xl font-mono text-white font-bold tracking-widest">
                        {selectedNumberForBet !== null 
                          ? (currentBetInput || "0") 
                          : (currentNumberInput || "___")
                        }
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-800/50 px-4 py-2 border-t border-gray-600">
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      {selectedNumberForBet !== null ? (
                        <>
                          <span className="text-gray-400">{currentBetInput.length}/4 digits</span>
                          {currentBetInput && (
                            <span className="text-green-400 font-medium">Bet: Ɐ{currentBetInput}</span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-gray-400">
                            {currentNumberInput.length === 1 && parseInt(currentNumberInput) > 2 && (
                              <span className="text-red-400 font-medium">Invalid first digit</span>
                            )}
                            {currentNumberInput === '2' && (
                              <span className="text-green-400 font-medium">Auto-complete: 200</span>
                            )}
                            {currentNumberInput.length === 3 && (
                              <span className="text-green-400 font-medium">✓ Valid number</span>
                            )}
                            {currentNumberInput.length === 0 && (
                              <span>Enter 1-200</span>
                            )}
                            {currentNumberInput.length === 1 && parseInt(currentNumberInput) <= 2 && currentNumberInput !== '2' && (
                              <span>Continue...</span>
                            )}
                            {currentNumberInput.length === 2 && (
                              <span>One more digit...</span>
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Keypad */}
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <Button
                    key={num}
                    onClick={() => handleKeypadPress(num.toString())}
                    className="h-14 md:h-16 text-lg md:text-xl font-bold bg-gradient-to-br from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 border-2 border-gray-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95"
                    variant="outline"
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  onClick={() => handleKeypadPress('0')}
                  className="h-14 md:h-16 text-lg md:text-xl font-bold bg-gradient-to-br from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 border-2 border-gray-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95"
                  variant="outline"
                >
                  0
                </Button>
                <Button
                  onClick={() => handleKeypadPress('←')}
                  className="h-14 md:h-16 text-sm md:text-base font-bold bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 border-2 border-orange-400 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95"
                  variant="outline"
                >
                  ← Back
                </Button>
                <Button
                  onClick={() => handleKeypadPress('C')}
                  className="h-14 md:h-16 text-sm md:text-base font-bold bg-gradient-to-br from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 border-2 border-red-400 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95"
                  variant="destructive"
                >
                  Clear
                </Button>
                {selectedNumberForBet !== null && (
                  <>
                    <Button
                      onClick={finishBetEntry}
                      className="h-14 md:h-16 text-sm md:text-base font-bold bg-gradient-to-br from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 border-2 border-green-400 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      ✓ Done
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedNumberForBet(null);
                        setCurrentBetInput("");
                      }}
                      className="h-14 md:h-16 text-sm md:text-base font-bold bg-gradient-to-br from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 border-2 border-gray-400 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      ← Back
                    </Button>
                  </>
                )}
              </div>

              {/* Welcome Bonus Banner - Below Keypad */}
              <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 rounded-2xl p-1 shadow-2xl mt-3 md:mt-4">
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-3 md:p-4 relative overflow-hidden">
                  {/* Animated background sparkles */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-2 left-3 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-60"></div>
                    <div className="absolute top-4 right-5 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse opacity-80"></div>
                    <div className="absolute bottom-3 left-7 w-1 h-1 bg-yellow-500 rounded-full animate-bounce opacity-40"></div>
                    <div className="absolute bottom-4 right-3 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-50 animation-delay-700"></div>
                  </div>
                  
                  {/* Bonus content */}
                  <div className="relative z-10 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="relative">
                        <svg className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <div className="absolute inset-0 text-yellow-400 blur-sm animate-pulse">★</div>
                      </div>
                    </div>
                    
                    <h3 className="text-sm md:text-base font-bold text-transparent bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text mb-2">
                      {t('home.welcome_bonus.title')}
                    </h3>
                    
                    <p className="text-gray-300 text-xs md:text-sm mb-3 font-medium">
                      {t('home.welcome_bonus.description')}
                    </p>
                    
                    <div className="inline-flex items-center bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-full px-4 py-2 border border-yellow-500/30">
                      <span className="text-yellow-400 font-bold text-sm md:text-base mr-2">100</span>
                      <span className="text-gray-300 text-xs md:text-sm">FREE COINS</span>
                    </div>
                    
                    <div className="mt-3">
                      <Link 
                        href={`/${locale}/register`}
                        className="inline-flex items-center justify-center px-5 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold text-sm md:text-base rounded-xl shadow-lg hover:shadow-yellow-500/25 transform hover:scale-105 transition-all duration-200 group"
                      >
                        <svg 
                          className="w-4 h-4 md:w-5 md:h-5 mr-2 group-hover:rotate-12 transition-transform duration-200" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M11 16l-4-4m0 0l4-4m-4 4h7m-7 4a2 2 0 01-2-2V6a2 2 0 012-2h7a2 2 0 012 2v8a2 2 0 01-2 2z" 
                          />
                        </svg>
                        {t('auth.register.create_account')}
                      </Link>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-400">
                      {t('home.welcome_bonus.terms')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Summary and Action Buttons */}
              <div className="space-y-3">
                {/* Ticket Summary */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border-2 border-gray-600 shadow-lg">
                  {isMounted ? (
                    <>
                      <div className="flex justify-between items-center text-sm md:text-base mb-3">
                        <span className="text-gray-400">Numbers:</span>
                        <span className="text-white font-bold">{calculateTotalNumbers()}/10</span>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <span className="text-gray-300 text-sm md:text-base font-bold">{t('play.total_bet_label')}</span>
                          <span className="text-yellow-400 text-sm md:text-base font-bold">
                            <CurrencyDisplay amount={calculateTotalBet()} showDecimals />
                          </span>
                        </div>
                        {selectedNumbers.size > 0 && (
                          <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || calculateTotalBet() === 0 || isLoading}
                            className="px-5 md:px-6 py-2.5 md:py-3 text-sm md:text-base bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95"
                          >
                            {isSubmitting ? (
                              <span className="flex items-center space-x-2">
                                <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
                                <span>{t('play.creating_ticket')}</span>
                              </span>
                            ) : isLoading ? (
                              <span className="flex items-center space-x-2">
                                <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
                                <span>Loading...</span>
                              </span>
                            ) : (
                              "Create Ticket"
                            )}
                          </Button>
                        )}
                      </div>
                      {error && (
                        <div className="bg-red-900/30 border-2 border-red-500/50 rounded-xl p-3 mt-3">
                          <p className="text-red-400 text-sm md:text-base">{error}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    // Server-side fallback
                    <>
                      <div className="flex justify-between items-center text-sm md:text-base mb-3">
                        <span className="text-gray-400">Numbers:</span>
                        <span className="text-white font-bold">0/10</span>
                      </div>
                      <div className="flex items-center space-x-2 md:space-x-3">
                        <span className="text-gray-300 text-sm md:text-base font-bold">{t('play.total_bet_label')}</span>
                        <span className="text-yellow-400 text-sm md:text-base font-bold">
                          <CurrencyDisplay amount={0} showDecimals />
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                {isMounted && selectedNumbers.size > 0 && (
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-semibold text-sm md:text-base flex items-center">
                      <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {t('play.selected_numbers')} ({calculateTotalNumbers()})
                    </h4>
                    <Button onClick={clearAll} variant="outline" className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 border-2 border-gray-400 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-sm md:text-base">
                      {t('play.clear_all')}
                    </Button>
                  </div>
                )}
              </div>

                          </div>

            {/* Right Side - Unified Ticket with 10 Rows */}
            <div className="space-y-3 md:space-y-4">
              {/* Unified Ticket Component */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 md:p-6 border-2 border-gray-600 min-h-[640px] shadow-2xl">
                <div className="text-center mb-3 md:mb-4">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 md:px-6 py-2 rounded-full text-sm md:text-base font-bold mb-2 shadow-lg">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{t('play.awra_lottery_ticket')}</span>
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm">{t('play.draw_date_next_sunday')}</p>
                </div>

                {/* 8 Rows for Numbers and Bets */}
                <div className="space-y-2 mb-2">
                  {isMounted ? (
                    Array.from({ length: 8 }).map((_, index) => {
                      // Get numbers in order of input (not sorted)
                      const numbersInOrder = Array.from(selectedNumbers);
                      const number = numbersInOrder[index];

                      return (
                        <div key={index} className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 rounded-lg p-2 md:p-3 shadow-lg">
                          {number ? (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-yellow-400 font-bold text-xs md:text-sm min-w-[30px]">#{index + 1}</span>
                              
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-300 font-semibold text-xs md:text-sm">Number:</span>
                                {editingNumber === number ? (
                                  <Input
                                    type="number"
                                    min="1"
                                    max="200"
                                    value={editingNumberValue}
                                    onChange={(e) => setEditingNumberValue(e.target.value)}
                                    onBlur={finishNumberEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        finishNumberEdit();
                                      } else if (e.key === 'Escape') {
                                        setEditingNumber(null);
                                        setEditingNumberValue("");
                                        setCurrentNumberInput("");
                                      }
                                    }}
                                    className="w-16 md:w-20 h-8 md:h-9 bg-gray-700/50 border-2 border-yellow-400/70 text-white text-center font-mono font-bold text-sm md:text-base focus:ring-2 focus:ring-yellow-400 focus:outline-none rounded-md [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                                  />
                                ) : (
                                  <div 
                                    onClick={() => {
                                      startNumberEdit(number);
                                      setCurrentNumberInput(number.toString());
                                    }}
                                    className="w-16 md:w-20 h-8 md:h-9 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-md flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-transform"
                                  >
                                    <span className="text-black font-mono font-bold text-sm md:text-base">
                                      {number.toString().padStart(3, '0')}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-300 font-semibold text-xs md:text-sm">Bet:</span>
                                <div className="flex items-center bg-gray-700/50 rounded-md px-2 py-1 shadow-inner">
                                  <span className="text-yellow-400 text-sm md:text-base font-bold mr-1">Ɐ</span>
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="0"
                                    value={betAmounts.get(number) || ""}
                                    onChange={(e) => handleBetAmountChange(number, e.target.value)}
                                    onFocus={() => startBetEntry(number)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        finishBetEntry();
                                      }
                                    }}
                                    className="w-16 md:w-20 h-7 md:h-8 bg-transparent border-none text-white placeholder-gray-400 text-sm md:text-base font-semibold focus:ring-0 focus:outline-none [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                                  />
                                </div>
                              </div>
                              
                              <Button
                                onClick={() => {
                                  setSelectedNumbers(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(number);
                                    return newSet;
                                  });
                                  setBetAmounts(prev => {
                                    const newMap = new Map(prev);
                                    newMap.delete(number);
                                    return newMap;
                                  });
                                  if (selectedNumberForBet === number) {
                                    setSelectedNumberForBet(null);
                                    setCurrentBetInput("");
                                  }
                                  if (editingNumber === number) {
                                    setEditingNumber(null);
                                    setEditingNumberValue("");
                                  }
                                }}
                                variant="destructive"
                                size="sm"
                                className="h-7 w-7 md:h-8 md:w-8 bg-red-600 hover:bg-red-500 rounded-md text-white text-base md:text-lg font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex-shrink-0"
                              >
                                ×
                              </Button>
                            </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-500 font-bold text-xs md:text-sm min-w-[30px]">#{index + 1}</span>
                            
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500 font-semibold text-xs md:text-sm">Number:</span>
                              {currentNumberInput && index === selectedNumbers.size ? (
                                <div className="w-16 md:w-20 h-8 md:h-9 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-md flex items-center justify-center border-2 border-dashed border-blue-400/50 animate-pulse">
                                  <span className="text-blue-300 font-mono font-bold text-sm md:text-base">
                                    {currentNumberInput.padEnd(3, '_')}
                                  </span>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => {
                                    setSelectedNumberForBet(null);
                                    setCurrentBetInput("");
                                    setCurrentNumberInput("");
                                    setActiveNumberSlot(index);
                                  }}
                                  className={`w-16 md:w-20 h-8 md:h-9 rounded-md flex items-center justify-center border-2 border-dashed cursor-pointer transition-all duration-200 ${
                                    activeNumberSlot === index 
                                      ? "bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-blue-400/50 animate-pulse" 
                                      : "bg-gray-700/50 border-gray-600 hover:bg-gray-600/50"
                                  }`}
                                >
                                  <span className={`font-mono text-sm md:text-base transition-colors ${
                                    activeNumberSlot === index ? "text-blue-300" : "text-gray-500"
                                  }`}>
                                    ___
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500 font-semibold text-xs md:text-sm">Bet:</span>
                              <div className="flex items-center bg-gray-700/50 rounded-md px-2 py-1">
                                <span className="text-gray-500 text-sm md:text-base font-bold mr-1">Ɐ</span>
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="0"
                                  value={betAmounts.get(-index) || ""}
                                  onChange={(e) => handleBetAmountChange(-index, e.target.value)}
                                  onFocus={() => startBetEntry(-index)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      finishBetEntry();
                                    }
                                  }}
                                  className="w-16 md:w-20 h-7 md:h-8 bg-transparent border-none text-white placeholder-gray-400 text-sm md:text-base font-semibold focus:ring-0 focus:outline-none [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                                />
                              </div>
                            </div>
                            
                            <div className="h-7 w-7 md:h-8 md:w-8 bg-gray-700/50 rounded-md flex items-center justify-center flex-shrink-0">
                              <span className="text-gray-500 text-base">-</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
) : (
                    // Server-side fallback - render empty slots
                    Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 rounded-lg p-2 md:p-3 shadow-lg">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-gray-500 font-bold text-xs md:text-sm min-w-[30px]">#{index + 1}</span>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500 font-semibold text-xs md:text-sm">Number:</span>
                            <div className="w-16 md:w-20 h-8 md:h-9 bg-gray-700/50 rounded-md flex items-center justify-center border-2 border-dashed border-gray-600 cursor-pointer hover:bg-gray-600/50 transition-colors">
                              <span className="text-gray-500 font-mono text-sm md:text-base">___</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500 font-semibold text-xs md:text-sm">Bet:</span>
                            <div className="flex items-center bg-gray-700/50 rounded-md px-2 py-1">
                              <span className="text-gray-500 text-sm md:text-base font-bold mr-1">Ɐ</span>
                              <span className="text-gray-500 text-sm md:text-base">0</span>
                            </div>
                          </div>
                          
                          <div className="h-7 w-7 md:h-8 md:w-8 bg-gray-700/50 rounded-md flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-500 text-base">-</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Balance Display - Compact */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-2xl p-4 md:p-5 border-2 border-gray-700 shadow-2xl mt-4 md:mt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              {isAuthenticated ? (
                <>
                  <p className="text-xs md:text-sm font-medium text-gray-400">{t('play.your_balance')}</p>
                  <p className="text-xl md:text-2xl font-bold text-yellow-500">
                    <CurrencyDisplay amount={user?.coinBalance || 0} showDecimals />
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs md:text-sm font-medium text-gray-400">{t('play.login_to_see_balance')}</p>
                  <Button asChild variant="outline" className="mt-2 text-xs md:text-sm py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white border-blue-400 hover:border-blue-300 rounded-xl">
                    <Link href={`/${locale}/login?redirect=${encodeURIComponent(pathname)}`}>Login</Link>
                  </Button>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs md:text-sm font-medium text-gray-400">{t('play.selected_numbers')}</p>
              <p className="text-xl md:text-2xl font-bold text-white">{calculateTotalNumbers()}</p>
            </div>
          </div>
        </div>

        {/* Game Rules Reminder */}
        <Card className="border-0 shadow-2xl bg-gray-800/95 backdrop-blur-sm rounded-2xl mt-4 md:mt-6">
          <CardContent className="p-6 md:p-8">
            <h3 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-yellow-400">{t('play.game_rules')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-sm md:text-base text-gray-300">
              <div>
                <p className="mb-2">• {t('play.rules_range')}</p>
                <p className="mb-2">• {t('play.rules_exact')}</p>
                <p>• {t('play.rules_partial')}</p>
              </div>
              <div>
                <p className="mb-2">• {t('play.rules_draws')}</p>
                <p className="mb-2">• {t('play.rules_results')}</p>
                <p>• {t('play.rules_sunday')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
