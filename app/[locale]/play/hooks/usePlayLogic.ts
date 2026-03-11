/**
 * Unified Play Logic Hook
 * 
 * Shared business logic for both mobile and desktop play components
 * Handles:
 * - Bet management (add, remove, update)
 * - Validation (number range, amount)
 * - localStorage persistence
 * - Bet submission
 * - Error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';

export interface Bet {
  id: string;
  number: number;
  amount: number;
}

export interface UsePlayLogicReturn {
  bets: Bet[];
  totalBet: number;
  error: string;
  isSubmitting: boolean;
  isMounted: boolean;
  
  // Actions
  addBet: (number: number, amount: number) => void;
  removeBet: (id: string) => void;
  updateBet: (id: string, number?: number, amount?: number) => void;
  clearBets: () => void;
  submitBets: () => Promise<{ success: boolean; message?: string }>;
  setError: (error: string) => void;
  clearError: () => void;
}

const STORAGE_KEY = 'playBets';
const MAX_BETS = 200;
const MIN_NUMBER = 1;
const MAX_NUMBER = 200;
const MIN_AMOUNT = 1;

export function usePlayLogic(): UsePlayLogicReturn {
  const convex = useConvex();
  
  // State
  const [bets, setBets] = useState<Bet[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBets(parsed);
        }
      }
    } catch (err) {
      console.error('Error loading bets from localStorage:', err);
    }
  }, []);

  // Save to localStorage whenever bets change
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      if (bets.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [bets, isMounted]);

  // Calculate total bet
  const totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);

  // Validation helpers
  const isValidNumber = (number: number): boolean => {
    return Number.isInteger(number) && number >= MIN_NUMBER && number <= MAX_NUMBER;
  };

  const isValidAmount = (amount: number): boolean => {
    return Number.isInteger(amount) && amount >= MIN_AMOUNT;
  };

  // Add bet
  const addBet = useCallback((number: number, amount: number) => {
    // Clear previous error
    setError('');

    // Validate number
    if (!isValidNumber(number)) {
      setError(`Number must be between ${MIN_NUMBER} and ${MAX_NUMBER}`);
      return;
    }

    // Validate amount
    if (!isValidAmount(amount)) {
      setError('Amount must be a positive integer');
      return;
    }

    // Check if number already exists
    if (bets.some(bet => bet.number === number)) {
      setError('This number is already in your bets');
      return;
    }

    // Check max bets limit
    if (bets.length >= MAX_BETS) {
      setError(`Maximum ${MAX_BETS} bets allowed`);
      return;
    }

    // Add bet
    const newBet: Bet = {
      id: `${Date.now()}-${Math.random()}`,
      number,
      amount,
    };

    setBets(prev => [...prev, newBet]);
  }, [bets]);

  // Remove bet
  const removeBet = useCallback((id: string) => {
    setBets(prev => prev.filter(bet => bet.id !== id));
    setError('');
  }, []);

  // Update bet
  const updateBet = useCallback((id: string, number?: number, amount?: number) => {
    setError('');

    setBets(prev => {
      const bet = prev.find(b => b.id === id);
      if (!bet) return prev;

      // Validate new number if provided
      if (number !== undefined && !isValidNumber(number)) {
        setError(`Number must be between ${MIN_NUMBER} and ${MAX_NUMBER}`);
        return prev;
      }

      // Validate new amount if provided
      if (amount !== undefined && !isValidAmount(amount)) {
        setError('Amount must be a positive integer');
        return prev;
      }

      // Check for duplicate number (excluding current bet)
      if (number !== undefined && number !== bet.number) {
        if (prev.some(b => b.id !== id && b.number === number)) {
          setError('This number is already in your bets');
          return prev;
        }
      }

      return prev.map(b =>
        b.id === id
          ? {
              ...b,
              number: number !== undefined ? number : b.number,
              amount: amount !== undefined ? amount : b.amount,
            }
          : b
      );
    });
  }, []);

  // Clear all bets
  const clearBets = useCallback(() => {
    setBets([]);
    setError('');
  }, []);

  // Submit bets
  const submitBets = useCallback(async () => {
    if (bets.length === 0) {
      setError('Please add at least one bet');
      return { success: false, message: 'No bets to submit' };
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Convert bets to submission format
      const betData = bets.map(bet => ({
        number: bet.number,
        amount: bet.amount,
      }));

      // Submit to API
      const response = await fetch('/api/tickets/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bets: betData }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit bets');
      }

      const result = await response.json();

      // Clear bets on success
      setBets([]);
      localStorage.removeItem(STORAGE_KEY);

      return { success: true, message: 'Bets submitted successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit bets';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, [bets]);

  return {
    bets,
    totalBet,
    error,
    isSubmitting,
    isMounted,
    addBet,
    removeBet,
    updateBet,
    clearBets,
    submitBets,
    setError,
    clearError: () => setError(''),
  };
}
