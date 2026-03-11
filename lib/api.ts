// lib/api.ts
import { Draw, Ticket, LoginRequest, RegisterRequest, AuthResponse, User } from "@/types/game";
import { getCachedCurrentDraw, setCachedCurrentDraw } from "./currentDrawCache";

const API_BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> || {}),
    };

    // Add auth token for Convex authentication
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
      // Remove credentials include since we're using token auth now
      // credentials: 'include', 
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // If authentication fails (401), the user needs to log in again
      if (response.status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-token-invalid'));
      }
      
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API Request Failed:`, error);
    throw error;
  }
}

// --- Game Data ---
export const getCurrentDraw = async (): Promise<Draw | null> => {
  try {
    // Use optimized cache with request deduplication
    if (typeof window !== 'undefined') {
      const { fetchCurrentDrawWithCache } = await import('./currentDrawCache');
      return await fetchCurrentDrawWithCache();
    }

    // Server-side: direct API call
    const data = await apiRequest<Draw>("/api/current-draw");
    return data;
  } catch (error) {
    console.error("Failed to fetch draw", error);
    return null;
  }
};

export const buyTicket = async (
  bets: { number: number; amount: number }[],
  drawDate: string,
  drawTime: string
): Promise<Ticket> => {
  return apiRequest<Ticket>("/api/tickets/unified", {
    method: "POST",
    body: JSON.stringify({ 
      bets: bets.map(bet => ({
        chosen_number: bet.number.toString(),
        amount_awra_coins: bet.amount
      })),
      draw_date: drawDate,
      draw_time: drawTime
    }),
  });
};

export const getMyTickets = async (
  status?: string,
  drawDate?: string,
  drawTime?: string,
  limit?: number
): Promise<{ tickets: Ticket[] }> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (drawDate) params.append('drawDate', drawDate);
  if (drawTime) params.append('drawTime', drawTime);
  if (limit) params.append('limit', limit.toString());
  
  const queryString = params.toString();
  const url = queryString ? `/api/tickets/unified?${queryString}` : '/api/tickets/unified';
  
  return apiRequest<{ tickets: Ticket[] }>(url);
};

// --- Authentication ---
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
};

export const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const getCurrentUser = async (): Promise<User> => {
  return apiRequest<User>("/api/auth/me");
};

export const logout = async (): Promise<void> => {
  return apiRequest<void>("/api/auth/logout", {
    method: "POST",
  });
};

export const claimWinnings = async (ticketId: string): Promise<{ success: boolean; message: string }> => {
  return apiRequest<{ success: boolean; message: string }>(`/api/tickets/claim/${ticketId}`, {
    method: "POST",
  });
};

// --- Payments --- (Social Casino: Only deposits allowed)
export const initiatePayment = async (paymentData: {
  amount_awra: number;
  type: 'DEPOSIT'; // Only deposits - users purchase virtual coins with real money
  provider: 'SQUARE' | 'SKRILL' | 'CRYPTO' | 'BANK';
  return_url?: string;
  cancel_url?: string;
  square_token?: string;
}): Promise<{ success: boolean; transaction?: any; payment_url?: string; message: string }> => {
  return apiRequest("/api/payments", {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
};

export const getTransactionHistory = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ transactions: any[]; total: number; page: number; limit: number }> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.status) searchParams.set('status', params.status);
  
  const query = searchParams.toString();
  return apiRequest(`/api/payments${query ? `?${query}` : ''}`);
};