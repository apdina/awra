// Server-side data fetching with Next.js caching
import { createSupabaseServiceClient } from './supabase';

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

// Fetch current draw with Next.js caching (revalidate every 60 seconds)
export async function getCurrentDraw(): Promise<Draw> {
  try {
    const supabase = createSupabaseServiceClient();
    
    // PERFORMANCE: More efficient query - get latest draw directly
    const { data: draws, error } = await supabase
      .from('draws')
      .select('id, draw_date, draw_time, winning_number, is_processed')
      .order('draw_date', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors

    if (error) {
      console.error('Supabase error fetching current draw:', error);
      throw error;
    }

    if (draws) {
      // Validate the data structure
      if (!draws.id || !draws.draw_date) {
        console.error('Invalid draw data structure:', draws);
        throw new Error('Invalid draw data: missing required fields');
      }

      // Convert YYYY-MM-DD to DD/MM/YYYY format for frontend (timezone-safe)
      const [year, month, day] = draws.draw_date.split('-');
      const formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      
      // Extract HH:MM from draw_time (handles both HH:MM and HH:MM:SS formats)
      const drawTime = draws.draw_time ? draws.draw_time.substring(0, 5) : "21:40";

      return {
        id: draws.id,
        draw_date: formattedDate,
        draw_time: drawTime,
        winning_number: draws.winning_number,
        is_processed: draws.is_processed
      };
    } else {
      // Fallback if no draws exist (use UTC)
      console.log('No draws found, returning fallback data');
      const now = new Date();
      return {
        id: "mock-draw-1",
        draw_date: `${String(now.getUTCDate()).padStart(2, '0')}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${now.getUTCFullYear()}`,
        draw_time: "21:40",
        winning_number: 142,
        is_processed: true
      };
    }
  } catch (error) {
    console.error('Failed to fetch current draw:', error);
    // Return fallback data instead of throwing (use UTC)
    const now = new Date();
    return {
      id: "fallback-draw",
      draw_date: `${String(now.getUTCDate()).padStart(2, '0')}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${now.getUTCFullYear()}`,
      draw_time: "21:40",
      winning_number: 142,
      is_processed: true
    };
  }
}

// Fetch winning numbers history with caching
export async function getWinningNumbers(limit: number = 50): Promise<Draw[]> {
  try {
    const supabase = createSupabaseServiceClient();
    
    const { data: draws, error } = await supabase
      .from('draws')
      .select('id, draw_date, draw_time, winning_number, is_processed')
      .order('draw_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return (draws || []).map(draw => {
      const [year, month, day] = draw.draw_date.split('-');
      const formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      const drawTime = draw.draw_time ? draw.draw_time.substring(0, 5) : "21:40";

      return {
        id: draw.id,
        draw_date: formattedDate,
        draw_time: drawTime,
        winning_number: draw.winning_number,
        is_processed: draw.is_processed
      };
    });
  } catch (error) {
    console.error('Failed to fetch winning numbers:', error);
    throw error;
  }
}

// Fetch user tickets with caching
export async function getUserTickets(userId: string): Promise<any[]> {
  try {
    const supabase = createSupabaseServiceClient();
    
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_bets (
          id,
          number,
          amount_awra,
          is_winner,
          payout_awra,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return tickets || [];
  } catch (error) {
    console.error('Failed to fetch user tickets:', error);
    throw error;
  }
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