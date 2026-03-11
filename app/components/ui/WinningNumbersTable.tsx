"use client";

import { useTranslationsFromPath } from '@/i18n/translation-context';

interface WinningNumberEntry {
  day: string;
  date: string;
  number: number;
}

interface WinningNumbersTableProps {
  winningNumbers: WinningNumberEntry[];
  title?: string;
  showStats?: boolean;
}

export default function WinningNumbersTable({ 
  winningNumbers, 
  title = "Winning Numbers History",
  showStats = true 
}: WinningNumbersTableProps) {
  const { t } = useTranslationsFromPath();
  const formatNumber = (num: number): string => {
    return num.toString().padStart(3, '0');
  };

  const totalDraws = winningNumbers.filter(entry => entry.day !== t('days.sunday')).length;
  const latestDraw = winningNumbers.find(entry => entry.day !== t('days.sunday'));

  return (
    <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
      <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">{title}</h3>
      
      {/* Mobile Card Layout */}
      <div className="block lg:hidden">
        <div className="space-y-3">
          {winningNumbers.map((entry, index) => {
            const isSunday = entry.day === t('days.sunday');
            
            return (
              <div 
                key={entry.date} 
                className={`border border-gray-600 rounded-lg p-3 transition-colors ${
                  index === 0 ? 'bg-gray-750' : 'bg-gray-800'
                } ${
                  isSunday ? 'bg-blue-900/20 border-blue-700' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className={`font-medium text-sm mb-1 ${
                      isSunday ? 'text-blue-400' : 'text-gray-300'
                    }`}>
                      {entry.day}
                      {isSunday && (
                        <span className="ml-2 text-xs bg-blue-800 text-blue-300 px-2 py-1 rounded">
                          {t('table.no_play')}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs ${
                      isSunday ? 'text-blue-300' : 'text-gray-400'
                    }`}>
                      {entry.date}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isSunday ? (
                      <span className="inline-block bg-gray-600 text-gray-400 px-2 py-1 rounded font-mono font-bold text-sm opacity-50">
                        ---
                      </span>
                    ) : (
                      <span className="inline-block bg-yellow-600 text-black px-3 py-1 rounded font-mono font-bold text-lg">
                        {formatNumber(entry.number)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-white">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-3 px-4 font-bold text-yellow-500">{t('table.day')}</th>
                <th className="text-left py-3 px-4 font-bold text-yellow-500">{t('table.date')}</th>
                <th className="text-center py-3 px-4 font-bold text-yellow-500">{t('table.winning_number')}</th>
              </tr>
            </thead>
            <tbody>
              {winningNumbers.map((entry, index) => {
                const isSunday = entry.day === t('days.sunday');
                
                return (
                <tr 
                  key={entry.date} 
                  className={`border-b border-gray-700 hover:bg-gray-700 transition-colors ${
                    index === 0 ? 'bg-gray-750' : ''
                  } ${
                    isSunday ? 'bg-blue-900/30' : '' // Special color for Sunday (no play day)
                  }`}
                >
                  <td className={`py-3 px-4 font-medium ${
                    isSunday ? 'text-blue-400' : 'text-gray-300'
                  }`}>
                    {entry.day}
                    {isSunday && (
                      <span className="ml-2 text-xs bg-blue-800 text-blue-300 px-2 py-1 rounded">
                        {t('table.no_play')}
                      </span>
                    )}
                  </td>
                  <td className={`py-3 px-4 ${
                    isSunday ? 'text-blue-400' : 'text-gray-300'
                  }`}>
                    {entry.date}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {isSunday ? (
                      <span className="inline-block bg-gray-600 text-gray-400 px-3 py-1 rounded font-mono font-bold text-lg opacity-50">
                        ---
                      </span>
                    ) : (
                      <span className="inline-block bg-yellow-600 text-black px-3 py-1 rounded font-mono font-bold text-lg">
                        {formatNumber(entry.number)}
                      </span>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showStats && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-700 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">{t('table.total_draws')}</div>
            <div className="text-xl sm:text-2xl font-bold text-white">{totalDraws}</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">{t('table.latest_draw')}</div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {latestDraw ? formatNumber(latestDraw.number) : '---'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
