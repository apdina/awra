/**
 * Desktop Tickets Table Component
 * 
 * Displays tickets in a grid layout for desktop users
 * Shows stats overview and ticket cards
 */

import { Ticket } from '@/types/game';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Ticket as TicketIcon, 
  Trophy, 
  X,
  Sparkles,
  Clock,
  ChevronDown,
  Wallet
} from 'lucide-react';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import Link from 'next/link';

interface TicketsTableProps {
  tickets: Ticket[];
  loading: boolean;
  error: string;
  displayLimit: number;
  hasMoreTickets: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  calculateTotalWinnings: (ticket: Ticket) => number;
  summaryStats: { totalSpent: number; totalWon: number };
  t: (key: string, params?: any) => string;
  locale: string;
}

const fadeInUp = "motion-preset-slide-up";
const fadeIn = "motion-preset-fade";
const scaleIn = "motion-preset-focus";

export function TicketsTable({
  tickets,
  loading,
  error,
  displayLimit,
  hasMoreTickets,
  loadingMore,
  onLoadMore,
  calculateTotalWinnings,
  summaryStats,
  t,
  locale,
}: TicketsTableProps) {
  const displayedTickets = tickets.slice(0, displayLimit);

  if (loading) {
    return (
      <div className={`${fadeIn} space-y-4`}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-xl bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`${scaleIn} border-0 shadow-2xl bg-gradient-to-br from-red-900/50 to-red-800/50 backdrop-blur-sm max-w-md mx-auto`}>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <X className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-red-200 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300"
          >
            {t('tickets.try_again')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className={`${scaleIn} border-0 shadow-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm max-w-lg mx-auto`}>
        <CardContent className="p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded-3xl flex items-center justify-center shadow-lg">
            <TicketIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">{t('tickets.no_tickets')}</h3>
          <p className="text-gray-400 mb-8 max-w-sm mx-auto">
            {t('tickets.no_tickets_desc')}
          </p>
          <Link
            href={`/${locale}/play`}
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-xl shadow-lg shadow-yellow-500/25 transition-all duration-300 hover:scale-105 group"
          >
            <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            {t('home.play_now')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className={`${fadeInUp} grid grid-cols-2 md:grid-cols-4 gap-4`}>
        <StatCard 
          icon={<TicketIcon className="w-5 h-5" />}
          label={t('tickets.total_tickets')}
          value={tickets.length}
          color="blue"
        />
        <StatCard 
          icon={<Clock className="w-5 h-5" />}
          label={t('tickets.active')}
          value={tickets.filter(t => t.status === 'ACTIVE').length}
          color="yellow"
        />
        <StatCard 
          icon={<Trophy className="w-5 h-5" />}
          label={t('tickets.won')}
          value={tickets.filter(t => t.status === 'WON').length}
          color="green"
        />
        <StatCard 
          icon={<Wallet className="w-5 h-5" />}
          label={t('tickets.net_profit')}
          value={<CurrencyDisplay amount={summaryStats.totalWon - summaryStats.totalSpent} showDecimals />}
          color={summaryStats.totalWon - summaryStats.totalSpent >= 0 ? "green" : "red"}
        />
      </div>

      {/* Tickets Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {displayedTickets.map((ticket, index) => (
          <div 
            key={`${ticket.id || 'unknown'}-${ticket.draw_id || 'unknown'}-${index}`} 
            className={`${fadeInUp} motion-delay-${Math.min(index * 100, 500)}`}
          >
            <TicketCardDesktop 
              ticket={ticket}
              calculateTotalWinnings={calculateTotalWinnings}
              t={t}
            />
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMoreTickets && (
        <div className={`${fadeInUp} text-center pt-4`}>
          <Button 
            onClick={onLoadMore}
            disabled={loadingMore}
            className="bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600/50 text-white font-medium px-8 py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                {t('tickets.loading_more')}
              </>
            ) : (
              <>
                {t('tickets.see_more')}
                <span className="ml-2 text-gray-400">
                  ({tickets.length - displayLimit} {t('tickets.remaining')})
                </span>
                <ChevronDown className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-300',
    yellow: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-300',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-300',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-300',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm rounded-2xl p-4 border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-xl">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium opacity-80 uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface TicketCardDesktopProps {
  ticket: Ticket;
  calculateTotalWinnings: (ticket: Ticket) => number;
  t: (key: string, params?: any) => string;
}

function TicketCardDesktop({ ticket, calculateTotalWinnings, t }: TicketCardDesktopProps) {
  const totalWon = calculateTotalWinnings(ticket);
  const hasWinnings = totalWon > 0;
  
  // Group bets by price and track winning bets
  const groupedByPrice = ticket.ticket_bets?.reduce((acc: Record<number, {numbers: number[], winningNumbers: number[]}>, bet) => {
    if (!acc[bet.amount_awra_coins]) {
      acc[bet.amount_awra_coins] = { numbers: [], winningNumbers: [] };
    }
    acc[bet.amount_awra_coins].numbers.push(bet.number);
    if (bet.is_winner) {
      acc[bet.amount_awra_coins].winningNumbers.push(bet.number);
    }
    return acc;
  }, {}) || {};

  return (
    <Card className="border-0 shadow-xl bg-gray-800 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-1">
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

      {/* Grouped Bets */}
      <div className="px-4 py-3 space-y-2">
        {Object.entries(groupedByPrice).map(([price, data]) => (
          <div key={price} className="flex gap-3 items-center text-sm">
            <div className="flex-1 flex flex-wrap gap-1">
              {(data as any).numbers.map((num: number) => {
                const isWinning = (data as any).winningNumbers.includes(num);
                return (
                  <div 
                    key={num} 
                    className={`px-2 py-1 rounded font-bold font-mono text-xs ${
                      isWinning 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30' 
                        : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black'
                    }`}
                  >
                    {num.toString().padStart(3, '0')}
                    {isWinning && (
                      <span className="ml-1 text-xs">🎯</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-yellow-400 font-semibold whitespace-nowrap">
              Ɐ {price}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="px-4 py-3 border-t border-gray-700 space-y-2">
        <div className="flex justify-between font-semibold">
          <span className="text-gray-300">{t('play.mobile.total')}:</span>
          <span className="text-yellow-400">Ɐ {ticket.total_amount_awra_coins}</span>
        </div>
        
        {hasWinnings && (
          <div className="flex justify-between font-semibold animate-pulse">
            <span className="text-green-300 flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              {t('tickets.winnings')}:
            </span>
            <span className="text-green-400 font-bold">Ɐ {totalWon}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
