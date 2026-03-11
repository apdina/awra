// components/TicketDisplay.tsx
import React, { useState } from 'react';
import { Edit2, Trash2, Check, X, Plus, TrendingUp, Calculator } from 'lucide-react';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';

interface BetItem {
  chosen_number: string;
  amount_awra_coins: number;
}

interface TicketDisplayProps {
  bets: BetItem[];
  costPerNumber: number; // e.g., 1 for 1 Ɐ
  onUpdateBet?: (index: number, newAmount: number) => void;
  onDeleteBet?: (index: number) => void;
}

export const TicketDisplay: React.FC<TicketDisplayProps> = ({ 
  bets, 
  costPerNumber, 
  onUpdateBet, 
  onDeleteBet 
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  
  const totalAwraCoins = bets.reduce((sum, bet) => sum + bet.amount_awra_coins, 0);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditAmount(bets[index].amount_awra_coins.toString());
  };

  const handleSaveEdit = (index: number) => {
    const newAmount = parseFloat(editAmount);
    if (newAmount > 0 && newAmount <= 50) {
      onUpdateBet?.(index, newAmount);
      setEditingIndex(null);
      setEditAmount("");
    } else {
      alert("Amount must be between 1Ɐ and 50Ɐ");
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditAmount("");
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50 shadow-lg w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white text-lg font-bold uppercase tracking-wider">
              Current Ticket
            </h2>
            <p className="text-gray-400 text-sm font-medium">{bets.length} numbers selected</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Cost</p>
          <p className="text-white text-xl font-bold font-mono">
            <CurrencyDisplay amount={totalAwraCoins} showDecimals />
          </p>
        </div>
      </div>
      
      {/* Bets Container */}
      <div className="bg-gray-700/50 rounded-lg p-4 min-h-[200px] mb-6 border border-gray-600/50">
        {bets.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-600/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 text-center italic">No numbers selected yet</p>
            <p className="text-gray-500 text-sm mt-2">Add numbers to start playing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bets.map((bet, index) => (
              <div 
                key={index} 
                className="bg-gray-800/50 p-3 rounded-lg border border-gray-600/50 hover:border-gray-500/50 hover:shadow-sm transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  {/* Number Display */}
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm font-mono">
                          {bet.chosen_number}
                        </span>
                      </div>
                      <span className="text-gray-400 text-xs mt-1 uppercase tracking-wider font-medium">Number</span>
                    </div>
                    
                    {/* Amount Display */}
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-xs uppercase tracking-wider mb-1 font-medium">Bet Amount</span>
                      {editingIndex === index ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            step="0.01"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-20 px-2 py-1 text-sm bg-gray-700 text-white border border-gray-600 rounded-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                            autoFocus
                          />
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleSaveEdit(index)}
                              className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded transition-all duration-200"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all duration-200"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                            <span className="text-green-400 font-mono font-bold">
                              <CurrencyDisplay amount={bet.amount_awra_coins} showDecimals />
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                      onClick={() => handleEdit(index)}
                      className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded transition-all duration-200"
                      title="Edit amount"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteBet?.(index)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all duration-200"
                      title="Remove bet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-700/50 rounded-lg p-3 text-center border border-gray-600/50">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1 font-medium">Numbers</p>
          <p className="text-white font-bold text-lg">{bets.length}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3 text-center border border-gray-600/50">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1 font-medium">Avg Bet</p>
          <p className="text-white font-bold text-lg font-mono">
            {bets.length > 0 ? (
              <CurrencyDisplay amount={totalAwraCoins / bets.length} showDecimals />
            ) : (
              <CurrencyDisplay amount={0} showDecimals />
            )}
          </p>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-3 text-center shadow-md">
          <p className="text-blue-100 text-xs uppercase tracking-wider mb-1 font-medium">Total</p>
          <p className="text-white font-bold text-lg font-mono">
            <CurrencyDisplay amount={totalAwraCoins} showDecimals />
          </p>
        </div>
      </div>
    </div>
  );
};