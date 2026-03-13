// Convex-based data fetching to replace Supabase
import { getConvexClient } from "./convex-client";
import { NextRequest } from "next/server";

function getConvexUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    console.error("NEXT_PUBLIC_CONVEX_URL is not set");
    return null;
  }
  return url;
}

/**
 * Gets the singleton Convex HTTP client for server-side use
 * This function provides a server-side Convex client that can be used
 * in API routes and server components
 */
async function getServerConvexClient(request?: NextRequest) {
  const convexUrl = getConvexUrl();
  if (!convexUrl) {
    throw new Error("Convex URL not configured");
  }
  
  // Use the singleton client
  const client = getConvexClient();
  
  // If we have a request, we could potentially extract auth tokens from cookies
  // and configure the client with authentication context here
  if (request) {
    // TODO: Extract auth token from cookies and configure client if needed
    // const token = request.cookies.get('auth_token')?.value;
    // if (token) {
    //   // Configure client with auth context
    // }
  }
  
  return client;
}

export interface Draw {
  id: string;
  draw_date: string; // DD/MM/YYYY format
  draw_time: string; // HH:MM format
  winning_number: number | null;
  is_processed: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  awra_coins: number;
  is_verified: boolean;
  is_active: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

// Use the singleton Convex HTTP client for server-side use
async function createConvexClient(request?: NextRequest) {
  if (request) {
    return getServerConvexClient(request);
  }
  
  const url = getConvexUrl();
  if (!url) {
    throw new Error("Convex URL not configured");
  }
  
  // Use the singleton client
  return getConvexClient();
}

// Fetch current draw with Convex
export async function getCurrentDrawConvex(): Promise<Draw> {
  try {
    const client = await createConvexClient();
    
    // Call Convex query to get current draw using the getOrCreateCurrentDraw query
    const currentDraw = await client.query("draws:getOrCreateCurrentDraw" as any, {});
    
    // Also fetch the latest draw time from systemConfig
    const drawTimeConfig = await client.query("systemConfig:getConfig" as any, {
      key: 'default_draw_time'
    });
    
    const drawTime = (drawTimeConfig?.value as string) || currentDraw?.draw_time || "21:40";
    
    if (currentDraw && currentDraw.draw_date) {
      return {
        id: currentDraw.id || "current-draw",
        draw_date: currentDraw.draw_date,
        draw_time: drawTime,
        winning_number: currentDraw.winning_number || null,
        is_processed: currentDraw.is_processed || false
      };
    } else {
      // Fallback if no draws exist
      const today = (() => {
        const now = new Date();
        return `${String(now.getUTCDate()).padStart(2, '0')}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${now.getUTCFullYear()}`;
      })();
      return {
        id: "mock-draw-1",
        draw_date: today,
        draw_time: drawTime,
        winning_number: null, // Don't show a fake winning number
        is_processed: false
      };
    }
  } catch (error) {
    console.error('Failed to fetch current draw from Convex:', error);
    // Return fallback data instead of throwing
    const today = (() => {
      const now = new Date();
      return `${String(now.getUTCDate()).padStart(2, '0')}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${now.getUTCFullYear()}`;
    })();
    return {
      id: "fallback-draw",
      draw_date: today,
      draw_time: "21:40",
      winning_number: null, // Don't show a fake winning number
      is_processed: false
    };
  }
}

// Fetch winning numbers history with Convex
export async function getWinningNumbersConvex(limit: number = 50): Promise<Draw[]> {
  try {
    const client = await createConvexClient();
    
    // Call Convex query to get draw history
    const history = await client.query("draws:getDrawHistory" as any, { limit });
    
    if (history && history.draws && Array.isArray(history.draws)) {
      return history.draws
        .filter((draw: any) => draw.status === "completed" && draw.winningNumber) // Only include completed draws with winning numbers
        .map((draw: any) => {
          // Use drawId directly (already in DD/MM/YYYY format) or format from drawingTime
          let formattedDate = draw.drawId;
          
          if (!formattedDate && draw.drawingTime) {
            const drawDate = new Date(draw.drawingTime);
            formattedDate = drawDate.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }).replace(/\//g, '/');
          }
          
          const drawTime = new Date(draw.drawingTime);
          const formattedTime = drawTime.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          
          return {
            id: draw._id,
            draw_date: formattedDate || new Date().toLocaleDateString('en-GB'), // Fallback to today
            draw_time: formattedTime,
            winning_number: draw.winningNumber || null,
            is_processed: draw.status === "completed"
          };
        });
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch winning numbers from Convex:', error);
    throw error;
  }
}

// Fetch user tickets with Convex (legacy - returns empty array)
export async function getUserTicketsConvex(userId: string): Promise<any[]> {
  console.log('⚠️ Legacy getUserTicketsConvex called - returning empty array');
  return [];
}

// Cached fetch wrapper for API calls with Next.js caching
export async function cachedApiCall<T>(
  endpoint: string, 
  revalidateSeconds: number = 60
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    next: { revalidate: revalidateSeconds }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// Migration helper: Use Convex directly to avoid circular dependencies
export async function getCurrentDrawHybrid(): Promise<Draw> {
  try {
    // Call Convex directly instead of the API route to avoid infinite loop
    return await getCurrentDrawConvex();
  } catch (error) {
    console.log('Convex fetch failed, using fallback:', error);
    return {
      id: "fallback-draw",
      draw_date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      }).replace(/\//g, '/'),
      draw_time: "21:40",
      winning_number: 142,
      is_processed: true
    };
  }
}

export async function getWinningNumbersHybrid(limit: number = 50): Promise<Draw[]> {
  try {
    // Call Convex directly instead of the API route to avoid infinite loop
    return await getWinningNumbersConvex(limit);
  } catch (error) {
    console.log('Convex fetch failed, falling back to empty array:', error);
    return [];
  }
}

export async function getUserTicketsHybrid(userId: string): Promise<any[]> {
  console.log('⚠️ Legacy getUserTicketsHybrid called - returning empty array');
  return [];
}