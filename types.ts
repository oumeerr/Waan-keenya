
export enum Language {
  ENGLISH = 'en',
  AMHARIC = 'am',
  OROMOO = 'om',
  TIGRINYA = 'ti'
}

export type View = 'home' | 'wallet' | 'leaderboard' | 'history' | 'profile' | 'how-to-play' | 'betting-list' | 'card-selection' | 'game' | 'promo' | 'settings' | 'all-cards' | 'payment-proof';

export interface BingoCard {
  id: number;
  grid: number[][]; // 5x5
}

export interface User {
  id: string; // UUID from Supabase
  username: string;
  mobile: string;
  balance: number;
  referrals: number;
  photo: string;
  email?: string;
  wins: number;
}

export interface Bank {
  id: string;
  name: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  timestamp: number;
  mood: 'lucky' | 'neutral' | 'tilted';
}

export interface GameHistoryItem {
  id: string;
  game_mode: 'classic' | 'mini';
  stake: number;
  payout: number;
  status: 'won' | 'lost' | 'draw' | 'abandoned';
  created_at: string;
  card_ids: number[];
  called_numbers: number[];
}
