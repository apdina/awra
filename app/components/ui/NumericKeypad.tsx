// components/NumericKeypad.tsx
import React from 'react';

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({ onKeyPress }) => {
  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'C', '0', '⌫'
  ];

  return (
    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto w-full">
      {keys.map((key) => {
        const isAction = key === 'C' || key === '⌫';
        
        return (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className={`
              h-20 rounded-xl text-2xl font-bold transition-all active:scale-95
              ${isAction 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/50' 
                : 'bg-gray-700 hover:bg-gray-600 text-white border-b-4 border-gray-900'
              }
            `}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
};