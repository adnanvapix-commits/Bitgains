import { createBrowserClient } from '@supabase/ssr';

// Browser-side Supabase client (uses anon key, respects RLS)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'user' | 'admin';
          is_active: boolean;
          referral_code: string | null;
          referral_count: number;
          referral_earnings: number;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          staked_amount: number;
          total_earnings: number;
          total_deposited: number;
          total_withdrawn: number;
          apr: number;
          staking_start_date: string | null;
          last_staking_update: string | null;
          created_at: string;
        };
      };
    };
  };
};
