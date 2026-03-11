"use client";

import { useState, useEffect } from "react";

interface WinningNumberEntry {
  day: string;
  date: string;
  number: number;
}

interface WinningNumbersSearchProps {
  winningNumbers: WinningNumberEntry[];
  onFilteredChange: (filtered: WinningNumberEntry[]) => void;
}

export default function WinningNumbersSearch({ 
  winningNumbers, 
  onFilteredChange 
}: WinningNumbersSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "day" | "date" | "number">("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterType, dateRange, winningNumbers]);

  const applyFilters = () => {
    let filtered = [...winningNumbers];

    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
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

    onFilteredChange(filtered);
  };

  const parseDate = (dateString: string): Date => {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setDateRange({ start: "", end: "" });
  };

  const formatNumber = (num: number): string => {
    return num.toString().padStart(3, '0');
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
      <h3 className="text-xl font-bold text-white mb-4">🔍 Search Previous Numbers</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="md:col-span-2 lg:col-span-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Search
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by day, date, or number..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        {/* Filter Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Filter By
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="all">All Fields</option>
            <option value="day">Day Only</option>
            <option value="date">Date Only</option>
            <option value="number">Number Only</option>
          </select>
        </div>

        {/* Date Range Start */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            From Date
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
            To Date
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
          onClick={applyFilters}
          className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded-lg font-medium transition-colors"
        >
          🔍 Apply Filters
        </button>
        <button
          onClick={clearFilters}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          🔄 Clear
        </button>
      </div>
    </div>
  );
}
