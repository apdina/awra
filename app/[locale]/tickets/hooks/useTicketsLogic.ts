/**
 * Unified Tickets Logic Hook
 * 
 * Shared business logic for both mobile and desktop tickets components
 * Handles:
 * - Loading tickets from API
 * - Transforming ticket data
 * - Calculating winnings
 * - Error handling
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Ticket } from '@/types/game';
import { useAuth } from '@/components/ConvexAuthProvider';

export interface UseTicketsLogicReturn {
  tickets: Ticket[];
  loading: boolean;
  error: string;
  isMounted: boolean;
  
  // Actions
  loadTickets: () => Promise<void>;
  calculateTotalWinnings: (ticket: Ticket) => number;
  
  // Summary stats
  summaryStats: {
    totalSpent: number;
    totalWon: number;
  };
}

export function useTicketsLogic(): UseTicketsLogicReturn {
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Mark as mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load tickets from API
  const loadTickets = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/tickets/unified', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to load tickets');
      }
      
      const data = await response.json();
      const userTickets = data.tickets || [];
      
      // Transform unified tickets to match Ticket type
      const transformedTickets: Ticket[] = userTickets.map((ticket: any) => {
        const safeCreatedDate = ticket.created_at ? new Date(ticket.created_at) : new Date();
        
        return {
          id: ticket.id || 'UNKNOWN',
          user_id: ticket.user_id || 'UNKNOWN',
          draw_id: ticket.draw_id || 'UNKNOWN-N/A',
          total_amount_awra_coins: ticket.total_amount_awra_coins || 0,
          status: ticket.status || 'ACTIVE',
          created_at: safeCreatedDate.toISOString(),
          draw_date: ticket.draw_date || 'N/A',
          draw_time: ticket.draw_time || 'N/A',
          ticket_bets: ticket.ticket_bets?.map((bet: any, index: number) => {
            const isExactMatch = bet.number === (ticket as any).winningNumber;
            const isPartialMatch = !isExactMatch && 
              (ticket as any).winningNumber && 
              (bet.number % 100) === ((ticket as any).winningNumber % 100);
            const isBetWinner = (ticket as any).isWinning && (isExactMatch || isPartialMatch);
            
            let betPayout = 0;
            if (isBetWinner) {
              if (isExactMatch) {
                betPayout = bet.amount_awra_coins * 100;
              } else if (isPartialMatch) {
                betPayout = bet.amount_awra_coins * 20;
              }
            }
            
            return {
              id: bet.id || `${ticket.id || 'unknown'}-${index}`,
              ticket_id: ticket.id || 'unknown',
              number: bet.number,
              amount_awra_coins: bet.amount_awra_coins,
              is_winner: isBetWinner,
              payout_awra_coins: betPayout,
              created_at: safeCreatedDate.toISOString()
            };
          }) || []
        };
      });
      
      setTickets(transformedTickets);
    } catch (err: any) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load tickets on mount and when auth changes
  useEffect(() => {
    if (isMounted) {
      loadTickets();
    }
  }, [isMounted, isAuthenticated, user, loadTickets]);

  // Calculate total winnings for a ticket
  const calculateTotalWinnings = useCallback((ticket: Ticket) => {
    return ticket.ticket_bets?.reduce((sum, bet) => sum + (bet.payout_awra_coins || 0), 0) || 0;
  }, []);

  // Memoize summary calculations
  const summaryStats = useMemo(() => {
    const totalSpent = tickets.reduce((sum, ticket) => sum + (ticket.total_amount_awra_coins || 0), 0);
    const totalWon = tickets.reduce((sum, ticket) => {
      const ticketWinnings = ticket.ticket_bets?.reduce((betSum, bet) => betSum + (bet.payout_awra_coins || 0), 0) || 0;
      return sum + ticketWinnings;
    }, 0);
    
    return { totalSpent, totalWon };
  }, [tickets]);

  return {
    tickets,
    loading,
    error,
    isMounted,
    loadTickets,
    calculateTotalWinnings,
    summaryStats,
  };
}
