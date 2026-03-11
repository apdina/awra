'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function ApiPreloader() {
  useEffect(() => {
    // Preload critical APIs after component mounts
    const preloadApis = async () => {
      const apis = [
        '/api/current-draw',
        '/api/warmup'
      ];

      // Stagger the requests to avoid overwhelming the server
      for (const api of apis) {
        try {
          await fetch(api, { method: 'GET' });
          logger.log(`✅ Preloaded ${api}`);
        } catch (error) {
          logger.log(`❌ Failed to preload ${api}:`, error);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    // Start preloading after a short delay to not block initial render
    const timer = setTimeout(preloadApis, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything
  return null;
}
