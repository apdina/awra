/**
 * Desktop Play Grid Component
 * 
 * Same table-like design as mobile
 * Multiple rows of input fields with dark theme
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/ConvexAuthProvider';
import { Button } from '@/components/ui/button';
import { Bet } from '../hooks/usePlayLogic';

interface PlayGridProps {
  bets: Bet[];
  totalBet: number;
  error: string;
  isSubmitting: boolean;
  onAddBet: (number: number, amount: number) => void;
  onRemoveBet: (id: string) => void;
  onSubmit: () => Promise<any>;
  onClear: () => void;
  t: (key: string) => string;
}

export function PlayGrid({
  bets,
  totalBet,
  error,
  isSubmitting,
  onAddBet,
  onRemoveBet,
  onSubmit,
  onClear,
  t,
}: PlayGridProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const { refreshUser } = useAuth();
  const [inputRows, setInputRows] = useState<Array<{ number: string; amount: string }>>(
    Array(8).fill(null).map(() => ({ number: '', amount: '' }))
  );

  const handleInputChange = (index: number, field: 'number' | 'amount', value: string) => {
    // Sanitize: only allow digits
    const sanitized = value.replace(/[^0-9]/g, '');
    
    // Prevent input if number is > 200
    if (field === 'number' && sanitized) {
      const num = parseInt(sanitized);
      if (num > 200) {
        return; // Don't update if > 200
      }
    }

    setInputRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: sanitized };
      return updated;
    });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number, field: 'number' | 'amount') => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    // Sanitize: only allow digits
    const sanitized = pastedText.replace(/[^0-9]/g, '');
    
    if (!sanitized) return;

    // Prevent input if number is > 200
    if (field === 'number') {
      const num = parseInt(sanitized);
      if (num > 200) {
        return;
      }
    }

    setInputRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: sanitized };
      return updated;
    });
  };

  const calculateInputTotal = () => {
    return inputRows.reduce((sum, row) => {
      const amount = parseInt(row.amount) || 0;
      return sum + amount;
    }, 0);
  };

  const handleAddFromInputs = async () => {
    const filledRows = inputRows.filter(row => row.number && row.amount);
    
    if (filledRows.length === 0) return;

    // Validate and prepare bets
    const betData = filledRows.map(row => ({
      number: parseInt(row.number),
      amount: parseInt(row.amount),
    }));

    // Submit directly without waiting for state
    try {
      const response = await fetch('/api/tickets/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bets: betData }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit bets');
      }

      const ticket = await response.json();

      // Refresh user balance
      await refreshUser();

      // Clear inputs on success
      setInputRows(Array(8).fill(null).map(() => ({ number: '', amount: '' })));
      
      // Redirect to tickets page
      router.push(`/${locale}/tickets`);
    } catch (err) {
      console.error('Error submitting bets:', err);
    }
  };

  const handleClearInputs = () => {
    setInputRows(Array(8).fill(null).map(() => ({ number: '', amount: '' })));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Input Table */}
        <div className="mb-6">
          <div className="space-y-0">
            {/* Header */}
            <div className="flex gap-4 px-4 py-2 bg-gray-700 rounded-t-lg">
              <div className="flex-1 text-gray-300 font-semibold text-sm">{t('home.numbers')}</div>
              <div className="w-20 text-right text-gray-300 font-semibold text-sm">{t('play.bet_placeholder')}</div>
            </div>

            {/* Input Rows */}
            <div className="bg-gray-800 overflow-hidden">
              {inputRows.map((row, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 px-3 py-2 items-center ${
                    idx !== inputRows.length - 1 ? 'border-b border-gray-700' : ''
                  }`}
                >
                  <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs font-semibold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={row.number}
                    onChange={(e) => handleInputChange(idx, 'number', e.target.value)}
                    onPaste={(e) => handlePaste(e, idx, 'number')}
                    className="flex-1 bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none text-sm"
                  />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={row.amount}
                    onChange={(e) => handleInputChange(idx, 'amount', e.target.value)}
                    onPaste={(e) => handlePaste(e, idx, 'amount')}
                    className="w-16 bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none text-sm text-right"
                  />
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex gap-4 px-4 py-3 bg-gray-700 font-semibold">
              <div className="flex-1 text-gray-300">{t('play.mobile.total')}</div>
              <div className="w-20 text-right text-lg">
                <span className="text-yellow-400">Ɐ</span><span className="text-yellow-300 ml-1">{calculateInputTotal()}</span>
              </div>
            </div>

            {/* Add Bets Button */}
            <Button
              onClick={handleAddFromInputs}
              disabled={inputRows.every(row => !row.number || !row.amount) || isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:bg-gray-600 rounded-b-lg text-white font-semibold py-3"
            >
              {isSubmitting ? t('play.mobile.creating') : t('play.mobile.create_ticket')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
