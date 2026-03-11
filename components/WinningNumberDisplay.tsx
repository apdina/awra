"use client";

import { getNumberName, getSizeIndicator, getImagePath, type Locale } from "@/lib/numberNames";

interface WinningNumberDisplayProps {
  number: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  locale?: Locale;
}

export function WinningNumberDisplay({ 
  number, 
  size = "md", 
  className = "",
  locale = 'en'
}: WinningNumberDisplayProps) {
  const sizeIndicator = getSizeIndicator(number);
  const numberName = getNumberName(number, locale);
  const imageNumber = number % 100 || 100; // For 103 -> 3, for 100 -> 100
  const imagePath = getImagePath(number);

  const sizeClasses = {
    sm: "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20",
    md: "w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32",
    lg: "w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-40 lg:h-40"
  };

  const badgeSizeClasses = {
    sm: "text-xs px-1 py-0.5 sm:text-xs sm:px-1.5 sm:py-0.5 md:text-sm md:px-2 md:py-1",
    md: "text-xs px-1.5 py-0.5 sm:text-sm sm:px-2 sm:py-1 md:text-sm md:px-3 md:py-1.5", 
    lg: "text-sm px-2 py-1 sm:text-sm sm:px-2.5 sm:py-1 md:text-base md:px-3 md:py-1.5 lg:text-lg lg:px-4 lg:py-2"
  };

  const nameSizeClasses = {
    sm: "text-xs sm:text-xs md:text-sm",
    md: "text-xs sm:text-sm md:text-base",
    lg: "text-sm sm:text-base md:text-lg"
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 md:space-x-6 ${className}`}>
      {/* Big Number Display */}
      <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-mono font-bold text-white">
        {number.toString().padStart(3, '0')}
      </span>

      {/* Image and Info Container */}
      <div className="flex flex-col items-center space-y-2">
        {/* Image Container */}
        <div className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-300 flex-shrink-0`}>
          <img
            src={`/gameimages/${imageNumber}.png`}
            alt={`Winning number ${number}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.log('❌ Image failed to load:', `/gameimages/${imageNumber}.png`);
              // Fallback - show number as text
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 font-bold text-2xl';
                fallback.textContent = imageNumber.toString();
                parent.appendChild(fallback);
              }
            }}
            onLoad={() => {
              console.log('✅ Image loaded successfully:', `/gameimages/${imageNumber}.png`);
            }}
          />
        </div>

        {/* Badge and Name Container */}
        <div className="flex items-center space-x-2">
          {/* Size Badge */}
          <div className={`inline-flex items-center justify-center rounded-full font-bold ${
            sizeIndicator === 'S' 
              ? 'bg-blue-500 text-white' 
              : 'bg-red-500 text-white'
          } ${badgeSizeClasses[size]}`}>
            {sizeIndicator}
          </div>

          {/* Number Name */}
          <div className={`text-center font-medium text-gray-300 ${nameSizeClasses[size]}`}>
            {numberName}
          </div>
        </div>
      </div>
    </div>
  );
}
