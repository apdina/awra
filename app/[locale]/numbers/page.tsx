"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslationsFromPath } from "@/i18n/translation-context";
import { getAllNumberNames, type Locale } from "@/lib/numberNames";
import PageWithSidebarAds from "@/components/layout/PageWithSidebarAds";

export default function NumbersPage() {
  const { t, locale } = useTranslationsFromPath();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get all number names for current locale
  const numberNames = getAllNumberNames(locale as Locale);
  
  // Filter numbers based on search
  const filteredNumbers = Object.entries(numberNames).filter(([num, name]) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      num.includes(searchTerm) ||
      name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <PageWithSidebarAds>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4">
            {t('numbers.title') || 'AWRA Number System'}
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            {t('numbers.description') || 'Each number from 1-100 has a unique name and symbolic meaning. Explore the complete AWRA number system below.'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-md mx-auto">
          <input
            type="text"
            placeholder={t('numbers.search_placeholder') || 'Search by number or name...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
          />
        </div>

        {/* Numbers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredNumbers.map(([number, name]) => (
            <div
              key={number}
              className="bg-gray-800 rounded-lg border border-gray-700 hover:border-yellow-500 transition-all duration-300 overflow-hidden group hover:shadow-lg hover:shadow-yellow-500/20"
            >
              {/* Number Badge */}
              <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold text-center py-2">
                {number}
              </div>
              
              {/* Image */}
              <div className="relative aspect-square bg-gray-900">
                <Image
                  src={`/gameimages/${number}.png`}
                  alt={name}
                  fill
                  className="object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
              </div>
              
              {/* Name */}
              <div className="p-3 text-center">
                <p className="text-white font-medium text-sm truncate" title={name}>
                  {name}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredNumbers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {t('numbers.no_results') || 'No numbers found matching your search.'}
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">
            {t('numbers.about_title') || 'About the AWRA Number System'}
          </h2>
          <p className="text-gray-300 leading-relaxed">
            {t('numbers.about_text') || 'AWRA uses a unique number naming system where each number from 1-100 has a special name in multiple languages. This system adds cultural richness and makes number identification more engaging and memorable. Each number represents a specific object, concept, or idea, creating a symbolic language that transcends traditional numerology.'}
          </p>
          </div>
        </main>
      </div>
    </PageWithSidebarAds>
  );
}
