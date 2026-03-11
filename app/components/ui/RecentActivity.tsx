"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Ticket, TicketBet } from "@/types/game";
import { getMyTickets } from "@/lib/api";
import { formatDateDDMMYYYY } from "@/lib/dateUtils";
import { useTranslationsFromPath } from '@/i18n/translation-context';

interface RecentActivityProps {
  userId?: string;
  isAuthenticated?: boolean;
}

export const RecentActivity = ({ userId, isAuthenticated }: RecentActivityProps) => {
  const { locale } = useTranslationsFromPath();
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchRecentTickets();
    }
  }, [isAuthenticated, userId]);

  const fetchRecentTickets = async () => {
    if (!userId) return;

    setLoading(true);
    setError("");
    try {
      const result = await getMyTickets();
      const tickets = result.tickets || [];
      // Sort by creation date (newest first) and take last 5
      const sortedTickets = tickets
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentTickets(sortedTickets);
    } catch (err: any) {
      setError(err.message || "Failed to load recent activity");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WON': return 'text-green-400 bg-green-900/20';
      case 'CLAIMED': return 'text-blue-400 bg-blue-900/20';
      case 'ACTIVE': return 'text-yellow-400 bg-yellow-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const formatTicketNumbers = (ticket: Ticket) => {
    return ticket.ticket_bets?.map((bet: TicketBet) => bet.number).join(', ') || 'No numbers';
  };

  const calculateTotalWinnings = (ticket: Ticket) => {
    const totalWinnings = ticket.ticket_bets?.reduce((sum, bet) => sum + bet.payout_awra_coins, 0) || 0;
    return totalWinnings.toFixed(2);
  };

  const calculateTotalCost = (ticket: Ticket) => {
    return ticket.total_amount_awra_coins.toFixed(2);
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-yellow-500 text-xl font-bold mb-4 uppercase tracking-wider">
          Recent Activity
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">Please log in to view your recent activity</p>
          <Link
            href={`/${locale}/login`}
            className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded font-bold transition-colors inline-block"
          >
            LOGIN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-yellow-500 text-xl font-bold uppercase tracking-wider">
          Recent Activity
        </h2>
        <button
          onClick={fetchRecentTickets}
          disabled={loading}
          className="text-gray-400 hover:text-white text-sm underline disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm mb-4 p-3 bg-red-900/20 border border-red-800 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-400">Loading recent activity...</div>
        </div>
      ) : recentTickets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No recent tickets found</p>
          <p className="text-gray-500 text-sm">Your recent lottery tickets will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {formatDateDDMMYYYY(ticket.created_at.split('T')[0])}
                    </span>
                  </div>
                  <div className="text-white font-mono text-sm mb-1">
                    Numbers: {formatTicketNumbers(ticket)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-400">
                  Cost: <span className="text-white font-mono">${calculateTotalCost(ticket)}</span>
                </div>
                <div className="text-gray-400">
                  Winnings: <span className={`font-mono font-bold ${
                    parseFloat(calculateTotalWinnings(ticket)) > 0 ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    ${calculateTotalWinnings(ticket)}
                  </span>
                </div>
              </div>

              {parseFloat(calculateTotalWinnings(ticket)) > 0 && ticket.status === 'WON' && (
                <div className="mt-2 text-center">
                  <span className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">
                    🎉 WINNER!
                  </span>
                </div>
              )}
            </div>
          ))}

          <div className="text-center mt-4">
            <Link
              href={`/${locale}/tickets`}
              className="text-yellow-500 hover:text-yellow-400 text-sm underline"
            >
              View all tickets →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};