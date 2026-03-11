/**
 * Mobile Tickets List Component
 * 
 * Displays tickets in a list layout for mobile users
 * Shows expandable ticket details
 */

import { useState } from 'react';
import { Ticket } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Link } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TicketsListProps {
  tickets: Ticket[];
  loading: boolean;
  error: string;
  calculateTotalWinnings: (ticket: Ticket) => number;
  t: (key: string, params?: any) => string;
  locale: string;
}

export function TicketsList({
  tickets,
  loading,
  error,
  calculateTotalWinnings,
  t,
  locale,
}: TicketsListProps) {
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="text-center text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400 mb-4">{t('tickets.no_tickets')}</p>
          <Button asChild className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold">
            <a href={`/${locale}/play`}>{t('home.play_now')}</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
          {t('tickets.my_tickets')}
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
        </p>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">
        {tickets.map((ticket, index) => {
          const totalWon = calculateTotalWinnings(ticket);
          const isExpanded = expandedTicketId === (ticket.id || `ticket-${index}`);
          
          return (
            <div key={`${ticket.id || 'unknown'}-${ticket.draw_id || 'unknown'}-${index}`} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              {/* Ticket Header */}
              <button
                onClick={() => setExpandedTicketId(isExpanded ? null : (ticket.id || `ticket-${index}`))}
                className="w-full p-3 flex items-center justify-between hover:bg-gray-750 transition-colors"
              >
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{t('tickets.id')}: {(ticket.id || 'UNKNOWN').slice(-6).toUpperCase()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      ticket.status === 'WON' ? 'bg-green-500/20 text-green-400' :
                      ticket.status === 'ACTIVE' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {ticket.draw_date || 'N/A'} • {ticket.draw_time || 'N/A'}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Ticket Summary Row */}
              <div className="px-3 py-2 bg-gray-750 border-t border-gray-700 space-y-1">
                {(() => {
                  // Group bets by price
                  const groupedByPrice = ticket.ticket_bets?.reduce((acc: Record<number, number[]>, bet) => {
                    if (!acc[bet.amount_awra_coins]) {
                      acc[bet.amount_awra_coins] = [];
                    }
                    acc[bet.amount_awra_coins].push(bet.number);
                    return acc;
                  }, {}) || {};

                  return Object.entries(groupedByPrice).map(([price, numbers]) => (
                    <div key={price} className="flex gap-2 items-center text-xs">
                      <div className="flex flex-wrap gap-1">
                        {(numbers as number[]).map((num) => (
                          <div key={num} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-1.5 py-0.5 rounded font-bold font-mono text-xs">
                            {num.toString().padStart(3, '0')}
                          </div>
                        ))}
                      </div>
                      <div className="text-yellow-400 font-semibold whitespace-nowrap">
                        Ɐ {price}
                      </div>
                    </div>
                  ));
                })()}
                {/* Total Row */}
                <div className="flex justify-between pt-1 border-t border-gray-600 mt-1">
                  <span className="text-gray-300 font-semibold">{t('play.mobile.total')}:</span>
                  <span className="text-yellow-400 font-semibold">Ɐ {ticket.total_amount_awra_coins}</span>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-3 py-3 border-t border-gray-700 space-y-2">
                  {/* Bets Table */}
                  <div className="space-y-1">
                    <div className="text-xs text-gray-400 font-semibold mb-2">{t('tickets.bet_details')}:</div>
                    {ticket.ticket_bets?.map((bet, idx) => (
                      <div key={bet.id} className="flex gap-2 text-xs">
                        <div className="w-6 text-gray-500">#{idx + 1}</div>
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-2 py-1 rounded font-bold font-mono flex-shrink-0">
                          {bet.number.toString().padStart(3, '0')}
                        </div>
                        <div className="text-yellow-400 font-semibold">Ɐ {bet.amount_awra_coins}</div>
                        {bet.is_winner && (
                          <div className="text-green-400 font-semibold ml-auto">
                            +Ɐ {bet.payout_awra_coins}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between font-semibold">
                    <span className="text-gray-300">{t('play.mobile.total')}:</span>
                    <span className="text-yellow-400">Ɐ {totalWon}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
