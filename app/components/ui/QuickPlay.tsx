"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NumericKeypad } from "./NumericKeypad";
import { TicketDisplay } from "./TicketDisplay";
import { buyTicket } from "@/lib/api";
import { useAuth } from "@/components/ConvexAuthProvider";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";

import { TicketBet } from "@/types/game";

interface BetItem {
  chosen_number: string;
  amount_awra_coins: number;
}

interface QuickPlayProps {
  isAuthenticated?: boolean;
  onClose?: () => void;
}

export const QuickPlay = ({ isAuthenticated = false, onClose }: QuickPlayProps) => {
  const router = useRouter();
  const { isAuthenticated: authIsAuthenticated } = useAuth();
  const [currentNumber, setCurrentNumber] = useState("");
  const [bets, setBets] = useState<BetItem[]>([]);
  const [selectedAmount, setSelectedAmount] = useState(5); // 5 Ɐ in awra_coins
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountOptions = [
    { label: "1 Ɐ", value: 1 },
    { label: "5 Ɐ", value: 5 },
    { label: "10 Ɐ", value: 10 },
  ];

  const handleKeyPress = (key: string) => {
    if (key === "C") {
      // Clear current number
      setCurrentNumber("");
    } else if (key === "⌫") {
      // Backspace
      setCurrentNumber(prev => prev.slice(0, -1));
    } else if (key >= "0" && key <= "9") {
      // Lottery number validation: only 001-200 allowed
      if (currentNumber.length === 0) {
        // First digit
        if (key === "0" || key === "1") {
          // Allow 0xx or 1xx numbers
          setCurrentNumber(key);
        } else if (key === "2") {
          // Auto-complete to 200
          setCurrentNumber("200");
        }
        // Ignore any other first digit (3-9)
      } else {
        // Subsequent digits - normal input up to 3 total digits
        if (currentNumber.length < 3) {
          setCurrentNumber(prev => prev + key);
        }
      }
    }
  };

  const addNumber = () => {
    if (currentNumber.length === 3) {
      const numValue = parseInt(currentNumber, 10);
      if (numValue >= 1 && numValue <= 200) {
      // Check if number already exists
      const existingBet = bets.find(bet => bet.chosen_number === currentNumber);
      if (existingBet) {
        // Update existing bet amount
        setBets(prev => prev.map(bet =>
          bet.chosen_number === currentNumber
            ? { ...bet, amount_awra_coins: bet.amount_awra_coins + selectedAmount }
            : bet
        ));
      } else {
        // Add new bet
        setBets(prev => [...prev, {
          chosen_number: currentNumber,
          amount_awra_coins: selectedAmount
        }]);
      }
      setCurrentNumber("");
      } else {
        // Invalid number (not in 001-200 range)
        alert("Please enter a number between 001 and 200");
      }
    }
  };

  const updateBet = (index: number, newAmount: number) => {
    setBets(prev => prev.map((bet, i) => 
      i === index ? { ...bet, amount_awra_coins: newAmount } : bet
    ));
  };

  const deleteBet = (index: number) => {
    setBets(prev => prev.filter((_, i) => i !== index));
  };

  const removeBet = (index: number) => {
    setBets(prev => prev.filter((_, i) => i !== index));
  };

  const handleBuyTicket = async () => {
    if (bets.length === 0) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Middleware will handle redirect automatically
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Purchasing ticket...");
      // Get current draw date and time (format: DD/MM/YYYY and HH:MM)
      const now = new Date();
      const drawDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const drawTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      // Transform bets to match the expected format
      const transformedBets = bets.map(bet => ({
        number: parseInt(bet.chosen_number),
        amount: bet.amount_awra_coins
      }));
      
      await buyTicket(transformedBets, drawDate, drawTime);
      
      console.log("Ticket purchased successfully");
      // Note: Balance will be updated automatically by Convex reactivity
      
      console.log("User data refreshed");
      
      // Clear the ticket after successful purchase
      setBets([]);
      setCurrentNumber("");
      // TODO: Show success message and update balance
      alert("Ticket purchased successfully!");
    } catch (error) {
      console.error("Failed to buy ticket:", error);
      // TODO: Show error message
      alert("Failed to purchase ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearAllBets = () => {
    setBets([]);
    setCurrentNumber("");
  };

  return (
    <div className="relative">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 transition-colors"
        aria-label="Close QuickPlay"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Number Input */}
        <div className="space-y-6">
          {/* Current Number Input */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-yellow-500 text-xl font-bold text-center mb-4 uppercase tracking-wider">
              Select Your Numbers
            </h3>

            {/* Current Number Display */}
            <div className="bg-black rounded-lg p-4 mb-4 border-2 border-gray-600">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-white mb-2 flex justify-center space-x-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <span
                    key={i}
                    className={`inline-block w-8 text-center ${
                      i < currentNumber.length ? "text-yellow-400" : "text-gray-600"
                    }`}
                  >
                    {i < currentNumber.length ? currentNumber[i] : "0"}
                  </span>
                ))}
              </div>
                <div className="text-gray-400 text-sm">Enter number 001-200</div>
              </div>
            </div>

            {/* Amount Selection */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-bold mb-2">Bet Amount</label>
              <div className="flex space-x-2">
                {amountOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedAmount(option.value);
                      setShowCustomInput(false);
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg font-bold transition-colors ${
                      selectedAmount === option.value && !showCustomInput
                        ? "bg-yellow-600 text-black"
                        : "bg-gray-700 hover:bg-gray-600 text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className={`py-2 px-4 rounded-lg font-bold transition-colors ${
                    showCustomInput
                      ? "bg-yellow-600 text-black"
                      : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
                >
                  Choose bet amount
                </button>
              </div>
            {showCustomInput && (
                <div className="mt-2 flex space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="e.g. 20"
                    className="flex-1 py-2 px-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const amount = parseInt(customAmount, 10);
                      if (amount > 0) {
                        if (amount > 50) {
                          alert("Bet amount too high. Please contact the team for larger bets.");
                        } else {
                          setSelectedAmount(amount);
                          setShowCustomInput(false);
                          setCustomAmount("");
                        }
                      }
                    }}
                    className="py-2 px-4 rounded-lg font-bold bg-green-600 hover:bg-green-700 text-white transition-colors"
                  >
                    Set
                  </button>
                </div>
              )}
            </div>

            {/* Add Number Button */}
            <button
              onClick={addNumber}
              disabled={currentNumber.length !== 3 || parseInt(currentNumber, 10) > 200}
              className={`w-full py-3 rounded-lg font-bold transition-colors mb-4 ${
                currentNumber.length === 3 && parseInt(currentNumber, 10) <= 200
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            >
              ADD NUMBER
            </button>

            {/* Numeric Keypad */}
            <NumericKeypad onKeyPress={handleKeyPress} />
          </div>
        </div>

      {/* Right Side - Ticket Preview & Actions */}
        <div className="space-y-6">
          {/* Ticket Display */}
          <TicketDisplay 
            bets={bets} 
            costPerNumber={selectedAmount} 
            onUpdateBet={updateBet}
            onDeleteBet={deleteBet}
          />

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleBuyTicket}
              disabled={bets.length === 0 || isSubmitting}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
                bets.length > 0 && !isSubmitting
                  ? "bg-yellow-600 hover:bg-yellow-700 text-black shadow-lg"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "PURCHASING..." : "BUY TICKET"}
            </button>

            {bets.length > 0 && (
              <button
                onClick={clearAllBets}
                className="w-full py-3 rounded-lg font-bold bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                CLEAR ALL
              </button>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-500">{bets.length}</div>
                <div className="text-gray-400 text-sm">Numbers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  <CurrencyDisplay amount={bets.reduce((sum, bet) => sum + bet.amount_awra_coins, 0)} showDecimals />
                </div>
                <div className="text-gray-400 text-sm">Total Cost</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};