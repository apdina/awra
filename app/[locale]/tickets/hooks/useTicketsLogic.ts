/**
 * Tickets Logic Hook - Ultra Stable
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Ticket } from '@/types/game';
import { useAuth } from '@/components/ConvexAuthProvider';
import { useTranslationsFromPath } from '@/i18n/translation-context';

export interface UseTicketsLogicReturn {
  t: any;
  locale: string;
  tickets: Ticket[];
  loading: boolean;
  error: string;
  summaryStats: {
    totalSpent: number;
    totalWon: number;
  };
  calculateTotalWinnings: (ticket: Ticket) => number;
}

export function useTicketsLogic(): UseTicketsLogicReturn {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useTranslationsFromPath();
  const { locale } = useTranslationsFromPath();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const calculateTotalWinnings = useCallback((ticket: Ticket) => {
    return ticket.ticket_bets?.reduce((sum, bet) => sum + Number(bet.payout_awra_coins || 0), 0) || 0;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchTickets = async () => {
      if (!isAuthenticated || !user || authLoading) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/tickets/unified', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          console.warn(`Tickets API ${response.status}:`, await response.text());
          if (!cancelled) setTickets([]);
          return;
        }

        const data = await response.json();
        console.log('Tickets loaded:', data.tickets?.length || 0);

        if (!cancelled) {
          const transformed: Ticket[] = (data.tickets || []).map((ticket: any) => ({
            ...ticket,
            total_amount_awra_coins: Number(ticket.total_amount_awra_coins || 0),
            ticket_bets: ticket.ticket_bets?.map((bet: any) => ({
              ...bet,
              amount_awra_coins: Number(bet.amount_awra_coins || 0),
              payout_awra_coins: Number(bet.payout_awra_coins || 0),
            })) || [],
          }));
          setTickets(transformed);
        }
      } catch (err) {
        console.error('Tickets fetch failed:', err);
        if (!cancelled) setTickets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTickets();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]); // Stable deps only

  const summaryStats = useMemo(() => {
    const totalSpent = tickets.reduce((sum, ticket) => sum + Number(ticket.total_amount_awra_coins || 0), 0);
    const totalWon = tickets.reduce((sum, ticket) => sum + calculateTotalWinnings(ticket), 0);
    return { totalSpent, totalWon };
  }, [tickets, calculateTotalWinnings]);

  return {
    t,
    locale,
    tickets,
    loading: loading || authLoading,
    error,
    summaryStats,
    calculateTotalWinnings,
  };
}

