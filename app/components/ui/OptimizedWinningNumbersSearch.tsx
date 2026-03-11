"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { WinningNumberEntry } from "@/types/game";
import { useTranslationsFromPath } from '@/i18n/translation-context';

interface OptimizedWinningNumbersSearchProps {
  winningNumbers: WinningNumberEntry[];
  onFilteredChange: (filtered: WinningNumberEntry[]) => void;
}

export default function OptimizedWinningNumbersSearch({ 
  winningNumbers, 
  onFilteredChange 
}: OptimizedWinningNumbersSearchProps) {
  const { t } = useTranslationsFromPath();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "day" | "date" | "number">("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term to avoid excessive re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Memoized filter function to avoid unnecessary recalculations
  const filteredNumbers = useMemo(() => {
    let filtered = [...winningNumbers];

    // Apply search term filter (using debounced value)
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(entry => {
        switch (filterType) {
          case "day":
            return entry.day.toLowerCase().includes(searchLower);
          case "date":
            return entry.date.includes(searchLower);
          case "number":
            return entry.number.toString().includes(searchLower) || 
                   entry.number.toString().padStart(3, '0').includes(searchLower);
          default:
            return (
              entry.day.toLowerCase().includes(searchLower) ||
              entry.date.includes(searchLower) ||
              entry.number.toString().includes(searchLower) ||
              entry.number.toString().padStart(3, '0').includes(searchLower)
            );
        }
      });
    }

    // Apply date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(entry => {
        const entryDate = parseDate(entry.date);
        const startDate = parseDate(dateRange.start);
        const endDate = parseDate(dateRange.end);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }

    return filtered;
  }, [debouncedSearchTerm, filterType, dateRange, winningNumbers]);

  // Update parent with filtered results
  useEffect(() => {
    onFilteredChange(filteredNumbers);
  }, [filteredNumbers, onFilteredChange]);

  const parseDate = useCallback((dateString: string): Date => {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilterType("all");
    setDateRange({ start: "", end: "" });
  }, []);

  const formatNumber = useCallback((num: number): string => {
    return num.toString().padStart(3, '0');
  }, []);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
      <h3 className="text-xl font-bold text-white mb-4">{t('search.title')}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="md:col-span-2 lg:col-span-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('search.search_label')}
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search.search_placeholder')}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          {searchTerm !== debouncedSearchTerm && (
            <div className="text-xs text-gray-500 mt-1">Typing...</div>
          )}
        </div>

        {/* Filter Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('search.filter_by')}
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="all">{t('search.all_fields')}</option>
            <option value="day">{t('search.day_only')}</option>
            <option value="date">{t('search.date_only')}</option>
            <option value="number">{t('search.number_only')}</option>
          </select>
        </div>

        {/* Date Range Start */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('search.from_date')}
          </label>
          <input
            type="text"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            placeholder="DD/MM/YYYY"
            pattern="\d{2}/\d{2}/\d{4}"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        {/* Date Range End */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('search.to_date')}
          </label>
          <input
            type="text"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            placeholder="DD/MM/YYYY"
            pattern="\d{2}/\d{2}/\d{4}"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onFilteredChange(filteredNumbers)}
          className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {t('search.apply_filters')}
        </button>
        <button
          onClick={clearFilters}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {t('search.clear')}
        </button>
      </div>

      {/* Search Stats */}
      {filteredNumbers.length !== winningNumbers.length && (
        <div className="mt-3 text-sm text-gray-400">
          {t('search.found_results', { found: filteredNumbers.length, total: winningNumbers.length })}
        </div>
      )}
    </div>
  );
}
