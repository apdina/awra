/**
 * Draw Time Helper
 * 
 * Centralized utility for getting the current draw time
 * Always reads from the unified API to ensure admin changes are reflected
 * 
 * Usage:
 * - Server-side: const time = await getDrawTimeFromAPI()
 * - Client-side: Use /api/draw endpoint directly
 */

import { getConvexClient } from './convex-client';
import { api } from '@/convex/_generated/api';

/**
 * Get the current draw time from systemConfig
 * This is the single source of truth for draw time
 * 
 * Server-side only (uses Convex client)
 */
export async function getDrawTimeFromConfig(): Promise<string> {
  try {
    const convex = getConvexClient();
    const config = await convex.query(api.systemConfig.getConfig, {
      key: 'default_draw_time'
    });
    
    return (config?.value as string) || '21:40';
  } catch (error) {
    console.error('Failed to fetch draw time from config:', error);
    return '21:40'; // Fallback
  }
}

/**
 * Get the current draw time from the unified draw API
 * This is the recommended way to get draw time on the server
 * 
 * Server-side only
 */
export async function getDrawTimeFromAPI(): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/draw?type=current`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    return data.data?.draw_time || '21:40';
  } catch (error) {
    console.error('Failed to fetch draw time from API:', error);
    return '21:40'; // Fallback
  }
}

/**
 * Get the current draw info from the unified draw API
 * Returns both date and time
 * 
 * Server-side only
 */
export async function getCurrentDrawInfo(): Promise<{
  draw_date: string;
  draw_time: string;
  dayOfWeek: string;
}> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/draw?type=current`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    const drawData = data.data;
    
    return {
      draw_date: drawData?.draw_date || (() => {
        const now = new Date();
        return `${String(now.getUTCDate()).padStart(2, '0')}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${now.getUTCFullYear()}`;
      })(),
      draw_time: drawData?.draw_time || '21:40',
      dayOfWeek: drawData?.countdown?.dayOfWeek || 'Unknown'
    };
  } catch (error) {
    console.error('Failed to fetch current draw info:', error);
    
    // Return fallback (use UTC)
    const now = new Date();
    return {
      draw_date: `${String(now.getUTCDate()).padStart(2, '0')}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${now.getUTCFullYear()}`,
      draw_time: '21:40',
      dayOfWeek: 'Unknown'
    };
  }
}

/**
 * IMPORTANT: For client-side code, use the /api/draw endpoint directly
 * 
 * Example:
 * ```typescript
 * const response = await fetch('/api/draw?type=current');
 * const { draw_time } = response.data;
 * ```
 * 
 * This ensures the client always gets the latest draw time from the server
 */
