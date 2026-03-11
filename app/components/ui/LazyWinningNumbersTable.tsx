"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { WinningNumberEntry } from "@/types/game";

interface LazyWinningNumbersTableProps {
  winningNumbers: WinningNumberEntry[];
  title?: string;
  showStats?: boolean;
  itemsPerPage?: number;
}

export default function LazyWinningNumbersTable({ 
  winningNumbers, 
  title = "Winning Numbers History",
  showStats = true,
  itemsPerPage = 20
}: LazyWinningNumbersTableProps) {
  const [visibleItems, setVisibleItems] = useState<WinningNumberEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const formatNumber = (num: number): string => {
    return num.toString().padStart(3, '0');
  };

  // Load initial items
  useEffect(() => {
    const initialItems = winningNumbers.slice(0, itemsPerPage);
    setVisibleItems(initialItems);
  }, [winningNumbers, itemsPerPage]);

  // Setup intersection observer for lazy loading
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading) {
          loadMoreItems();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoading, visibleItems, winningNumbers, itemsPerPage]);

  const loadMoreItems = useCallback(() => {
    if (isLoading || visibleItems.length >= winningNumbers.length) return;

    setIsLoading(true);
    
    // Simulate network delay for smoother UX
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const startIndex = visibleItems.length;
      const endIndex = Math.min(startIndex + itemsPerPage, winningNumbers.length);
      const newItems = winningNumbers.slice(startIndex, endIndex);
      
      setVisibleItems(prev => [...prev, ...newItems]);
      setCurrentPage(nextPage);
      setIsLoading(false);
    }, 100);
  }, [currentPage, visibleItems.length, winningNumbers, itemsPerPage, isLoading]);

  const totalDraws = winningNumbers.filter(entry => entry.day !== 'Sunday').length;
  const latestDraw = winningNumbers.find(entry => entry.day !== 'Sunday');

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-2xl font-bold text-white mb-6 text-center">{title}</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-white">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-3 px-4 font-bold text-yellow-500">Day</th>
              <th className="text-left py-3 px-4 font-bold text-yellow-500">Date</th>
              <th className="text-center py-3 px-4 font-bold text-yellow-500">Winning Number</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((entry, index) => {
              const isSunday = entry.day === 'Sunday';
              
              return (
                <tr 
                  key={entry.date} 
                  className={`border-b border-gray-700 hover:bg-gray-700 transition-colors ${
                    index === 0 ? 'bg-gray-750' : ''
                  } ${
                    isSunday ? 'bg-blue-900/30' : ''
                  }`}
                >
                  <td className={`py-3 px-4 font-medium ${
                    isSunday ? 'text-blue-400' : 'text-gray-300'
                  }`}>
                    {entry.day}
                    {isSunday && (
                      <span className="ml-2 text-xs bg-blue-800 text-blue-300 px-2 py-1 rounded">
                        No Play
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

      {/* Loading indicator and trigger for lazy loading */}
      {visibleItems.length < winningNumbers.length && (
        <div 
          ref={loadMoreRef}
          className="text-center py-4"
        >
          {isLoading ? (
            <div className="flex justify-center items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
              <span className="text-gray-400">Loading more...</span>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              Scroll to load more entries...
            </div>
          )}
        </div>
      )}

      {showStats && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">Total Draws</div>
            <div className="text-2xl font-bold text-white">{totalDraws}</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">Latest Draw</div>
            <div className="text-2xl font-bold text-white">
              {latestDraw ? formatNumber(latestDraw.number) : '---'}
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">Showing</div>
            <div className="text-2xl font-bold text-white">
              {visibleItems.length} / {winningNumbers.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
