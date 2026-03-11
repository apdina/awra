// components/CurrencyDisplay.tsx
import React from 'react';
import { formatAwraCoins, getCurrencyClass, getCurrencyStyle, CurrencyFormatOptions } from '@/lib/currency';

interface CurrencyDisplayProps {
  amount: number; // Amount in awra units (1 = 1 Ɐ)
  showSymbol?: boolean;
  showDecimals?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  inline?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  showSymbol = true,
  showDecimals = false,
  size = 'md',
  className = '',
  inline = false,
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-bold',
  };

  const baseClasses = `
    ${getCurrencyClass()}
    ${sizeClasses[size]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const formattedCurrency = formatAwraCoins(amount, {
    showSymbol,
    showDecimals,
  });

  return (
    <span className={baseClasses} style={getCurrencyStyle()}>
      {formattedCurrency}
    </span>
  );
};

export default CurrencyDisplay;
