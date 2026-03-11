// types/game.ts

export interface User {
  id: string;
  username: string;
  email: string;
  awra_coins: number; // Stored in awra coins (1 = 1 Ɐ)
  is_verified: boolean;
  is_active: boolean;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  session: string | null;
  token?: string; // For backward compatibility
}

export interface Session {
  user: User;
  token: string;
}

export interface Draw {
  id: string;
  draw_date: string; // Strict Format: DD/MM/YYYY (e.g., "20/01/2025")
  draw_time: string; // Format: HH:MM (e.g., "21:40")
  winning_number: number | null; // e.g., 154
  is_processed: boolean;
}

export interface TicketBet {
  id: string;
  ticket_id: string;
  number: number; // 1-200
  amount_awra_coins: number;
  is_winner: boolean;
  payout_awra_coins: number;
  created_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  draw_id: string;
  total_amount_awra_coins: number; // Total amount in awra_coins
  status: 'ACTIVE' | 'WON' | 'CLAIMED' | 'CANCELLED';
  created_at: string;
  draw_date?: string; // DD/MM/YYYY format
  draw_time?: string; // HH:MM format
  ticket_bets?: TicketBet[];
}

export interface WinningNumberEntry {
  day: string;
  date: string;
  number: number;
}

// Payment Types
export interface Transaction {
  id: string;
  user_id: string;
  amount_awra: number;
  type: 'DEPOSIT' | 'WIN_PAYOUT';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  provider: 'SQUARE' | 'SKRILL' | 'CRYPTO' | 'BANK';
  provider_txn_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaymentRequest {
  amount_awra: number;
  type: 'DEPOSIT';
  provider: 'SQUARE' | 'SKRILL' | 'CRYPTO' | 'BANK';
  return_url?: string;
  cancel_url?: string;
  square_token?: string;
  bank_details?: {
    account_holder_name: string;
    bank_name: string;
    routing_number: string;
    account_number: string;
  };
  payment_details?: {
    card_number?: string;
    expiry_month?: string;
    expiry_year?: string;
    cvv?: string;
    cardholder_name?: string;
    billing_address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
}

export interface PaymentResponse {
  success: boolean;
  transaction?: Transaction;
  payment_url?: string; // For redirect-based payments
  message: string;
}

export interface SkrillConfig {
  merchant_email: string;
  api_url: string;
  secret_word: string;
}

export interface TransactionHistory {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}