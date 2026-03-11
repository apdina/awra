// lib/currency.ts

export interface CurrencyFormatOptions {
  showSymbol?: boolean;
  showDecimals?: boolean;
  color?: boolean;
}

/**
 * Format awra coins for display
 * @param awra - Amount in awra coins (1 = 1 Ɐ)
 * @returns Formatted currency string
 */
export const formatAwraCoins = (
  awra: number,
  options: CurrencyFormatOptions = {}
): string => {
  const { showSymbol = true, showDecimals = false, color = false } = options;
  
  // Format the number (1 unit = 1 Ɐ, no conversion needed)
  const formattedNumber = showDecimals
    ? awra.toFixed(2)
    : Math.floor(awra).toString();
  
  // Add symbol if requested
  const withSymbol = showSymbol ? `${formattedNumber} Ɐ` : formattedNumber;
  
  // Add color if requested (for HTML/React)
  if (color) {
    return `<span style="color: #ff6b35; font-weight: 600;">${withSymbol}</span>`;
  }
  
  return withSymbol;
};

/**
 * Parse display format back to awra coins
 * @param displayValue - String like "5.50Ɐ" or "5.50"
 * @returns Amount in awra coins
 */
export const parseAwraCoins = (displayValue: string): number => {
  // Remove symbol and whitespace
  const cleanValue = displayValue.replace(/[Ɐ\s]/g, '');
  
  // Parse as float
  const parsed = parseFloat(cleanValue);
  
  if (isNaN(parsed)) {
    throw new Error('Invalid currency format');
  }
  
  return parsed;
};

/**
 * Get CSS class for orange currency styling
 */
export const getCurrencyClass = (): string => {
  return 'text-orange-500 font-semibold';
};

/**
 * Get inline style for orange currency
 */
export const getCurrencyStyle = (): React.CSSProperties => {
  return {
    color: '#ff6b35',
    fontWeight: 600,
  };
};

/**
 * Common currency amounts in awra coins
 */
export const AWRA_COIN_AMOUNTS = {
  ONE_COIN: 1,        // 1 Ɐ
  FIVE_COINS: 5,      // 5 Ɐ
  TEN_COINS: 10,      // 10 Ɐ
  TWENTY_COINS: 20,   // 20 Ɐ
  FIFTY_COINS: 50,    // 50 Ɐ
  HUNDRED_COINS: 100, // 100 Ɐ
} as const;

/**
 * Validate awra amount
 */
export const validateAwraCoins = (amount: number): boolean => {
  return Number.isFinite(amount) && amount >= 0 && amount <= 999999;
};
