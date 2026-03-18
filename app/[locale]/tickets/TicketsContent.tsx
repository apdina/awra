"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Ticket as TicketIcon, Sparkles, Clock, Trophy, Wallet, ChevronDown, ChevronUp, X } from 'lucide-react';
import PageWithSidebarAds from '@/components/layout/PageWithSidebarAds';
import { useTicketsLogic } from './hooks/useTicketsLogic';
import { Ticket } from '@/types/game';
import { useState } from 'react';

/**
 * UNIFIED RESPONSIVE TicketsContent - FINAL CLEAN VERSION
 */

export default function TicketsContent() {
  const {
    t,
    locale,
    tickets,
    loading,
    error,
    summaryStats,
    calculateTotalWinnings,
  } = useTicketsLogic();

  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(6);

  if (loading) {
    return (
      <PageWithSidebarAds>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4" />
            <p className="text-white">{t('common.loading')}</p>
          </div>
        </div>
      </PageWithSidebarAds>
    );
  }

  if (error) {
    return (
      <PageWithSidebarAds>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-0 shadow-2xl bg-gradient-to-br from-red-900/50 to-red-800/50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <X className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-red-200 mb-6">{error}</p>
              <Button onClick={() => window.location.reload()} className="w-full bg-red-500 hover:bg-red-600">
                {t('tickets.try_again')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageWithSidebarAds>
    );
  }

  // Show no tickets only after loading complete
  if (tickets.length === 0 && !loading) {
    return (
      <PageWithSidebarAds>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full border-0 shadow-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded-3xl flex items-center justify-center shadow-lg">
                <TicketIcon className="h-12 w-12 text-gray-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-white mb-3">{t('tickets.no_tickets')}</CardTitle>
              <CardDescription className="text-gray-400 mb-8">
                {t('tickets.no_tickets_desc')}
              </CardDescription>
              <Button asChild className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold py-6 rounded-xl shadow-lg">
                <Link href={`/${locale}/play`}>{t('home.play_now')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageWithSidebarAds>
    );
  }

  return (
    <PageWithSidebarAds>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 hidden lg:block overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-500/10 rounded-full blur-xl animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-yellow-400/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}} />
        </div>

        <main className="relative container mx-auto px-4 py-6 z-10 max-w-5xl">
          {/* Mobile Header */}
          <div className="block lg:hidden sticky top-0 z-20 mb-6 pt-4 pb-3 px-6 mx-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/10 to-orange-500/20 border border-amber-500/40 backdrop-blur-sm shadow-2xl">
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">
              {t('tickets.my_tickets')}
            </h1>
            <p className="text-xs text-amber-200 font-semibold mt-1">{tickets.length} tickets</p>
          </div>

          {/* Desktop Stats */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<TicketIcon className="w-5 h-5" />} label={t('tickets.total_tickets')} value={tickets.length} color="blue" />
            <StatCard icon={<Clock className="w-5 h-5" />} label="Active" value={tickets.filter(t => t.status === 'ACTIVE').length} color="yellow" />
            <StatCard icon={<Trophy className="w-5 h-5" />} label="Won" value={tickets.filter(t => t.status === 'WON').length} color="green" />
            <StatCard icon={<Wallet className="w-5 h-5" />} label="Net" value={`Ɐ ${summaryStats.totalWon - summaryStats.totalSpent}`} color={summaryStats.totalWon > summaryStats.totalSpent ? "green" : "red"} />
          </div>

          <div className="mx-2 md:mx-0 space-y-4 lg:space-y-6">
            {tickets.slice(0, displayLimit).map((ticket, index) => (
              <TicketCard 
                key={`${ticket.id}-${index}`}
                ticket={ticket}
                totalWon={calculateTotalWinnings(ticket)}
                isExpanded={expandedTicketId === ticket.id}
                onToggle={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id!)}
                t={t}
              />
            ))}
          </div>

          {tickets.length > displayLimit && (
            <>
              {/* Mobile See More */}
              <div className="block lg:hidden text-center pt-8">
                <Button 
                  onClick={() => setDisplayLimit(p => p + 6)} 
                  className="mx-auto bg-gray-800 hover:bg-gray-700 border px-8 py-3 rounded-xl text-sm font-medium"
                  size="lg"
                >
                  {t('tickets.see_more', { remaining: tickets.length - displayLimit }) ?? `See more (${tickets.length - displayLimit} left)`}
                </Button>
              </div>
              
              {/* Desktop See More */}
              <div className="hidden lg:block text-center pt-8">
                <Button onClick={() => setDisplayLimit(p => p + 6)} className="bg-gray-800 hover:bg-gray-700 border px-8 py-3 rounded-xl">
                  See more ({tickets.length - displayLimit} left)
                </Button>
              </div>
            </>
          )}

        </main>
      </div>
    </PageWithSidebarAds>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-300',
    yellow: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-300',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-300',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-300',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color as keyof typeof colors]} rounded-2xl p-4 border shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-xl">{icon}</div>
        <div>
          <p className="text-xs font-medium opacity-80 uppercase">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface TicketCardProps {
  ticket: Ticket;
  totalWon: number;
  isExpanded: boolean;
  onToggle: () => void;
  t: any;
}

function TicketCard({ ticket, totalWon, isExpanded, onToggle, t }: TicketCardProps) {
  const groupedByPrice = ticket.ticket_bets?.reduce((acc: Record<number, number[]>, bet) => {
    if (!acc[bet.amount_awra_coins]) acc[bet.amount_awra_coins] = [];
    acc[bet.amount_awra_coins].push(bet.number);
    return acc;
  }, {}) || {};

  return (
  <Card className="border-0 shadow-xl mx-2 md:mx-0 bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm overflow-hidden hover:shadow-2xl hover:from-gray-700/80 hover:to-gray-600/80 transition-all rounded-2xl">
      <button 
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-700/80 transition-colors"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-white">
              ID: {(ticket.id || 'UNKNOWN').slice(-6).toUpperCase()}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
              ticket.status === 'WON' ? 'bg-green-500/20 text-green-400' :
              ticket.status === 'ACTIVE' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-600/20 text-gray-400'
            }`}>
              {ticket.status}
            </span>
          </div>
          <div className="font-bold text-xs text-gray-200">
            {ticket.draw_date} • {ticket.draw_time}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <div className="px-4 py-3 bg-gray-750 border-t border-gray-700 space-y-2">
        {Object.entries(groupedByPrice).map(([price, numbers]) => (
          <div key={price} className="flex justify-between items-center pt-1 border-t border-gray-600 first:border-t-0">
            <div className="flex flex-wrap gap-1">
              {numbers.map((num: number) => (
                <div key={num} className="px-1.5 py-0.5 rounded font-bold font-mono text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
                  {num.toString().padStart(3, '0')}
                </div>
              ))}
            </div>
            <div className="text-yellow-400 font-semibold ml-2">
              Ɐ {price}
            </div>
          </div>
        ))}
        <div className="flex justify-between pt-1 border-t border-gray-600 font-semibold">
          <span>Total:</span>
          <span className="text-yellow-400">Ɐ {ticket.total_amount_awra_coins}</span>
        </div>
        {totalWon > 0 && (
          <div className="flex justify-between font-bold text-green-400">
            <span>Winnings:</span>
            <span>Ɐ {totalWon}</span>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="px-4 py-3 border-t border-gray-700 space-y-2">
          <div className="text-xs text-gray-400 font-semibold mb-2">Bet details:</div>
          <div className="space-y-1">
            {ticket.ticket_bets?.map((bet, idx) => (
              <div key={bet.id} className="flex gap-2 text-xs items-center">
                <div className="w-6 text-gray-500">#{idx + 1}</div>
                <div className="px-2 py-1 rounded font-bold font-mono bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
                  {bet.number.toString().padStart(3, '0')}
                </div>
                <div className="text-yellow-400 font-semibold ml-auto">
                  Ɐ {bet.amount_awra_coins}
                </div>
                {bet.is_winner && (
                  <div className="text-green-400 font-semibold ml-2">
                    +Ɐ {bet.payout_awra_coins}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

