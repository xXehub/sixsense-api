import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for backend operations (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types
export interface User {
  id: string;
  discord_id: string;
  discord_username: string | null;
  discord_avatar: string | null;
  created_at: string;
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
  banned_by: string | null;
  notes: string | null;
}

export interface Key {
  id: string;
  key_value: string;
  user_id: string | null;
  hwid: string | null;
  hwid_locked: boolean;
  hwid_locked_at: string | null;
  key_type: 'lifetime' | 'daily' | 'weekly' | 'monthly';
  duration_days: number | null;
  expires_at: string | null;
  max_hwid_resets: number;
  hwid_resets_used: number;
  last_hwid_reset: string | null;
  created_at: string;
  created_by: string | null;
  last_used_at: string | null;
  last_used_ip: string | null;
  last_executor: string | null;
  total_uses: number;
  is_active: boolean;
  deactivated_at: string | null;
  deactivated_reason: string | null;
  users?: User;
}

export interface UsageLog {
  id: string;
  key_id: string;
  user_id: string | null;
  hwid: string;
  executor: string | null;
  executor_version: string | null;
  game_id: number | null;
  game_name: string | null;
  player_name: string | null;
  player_id: number | null;
  ip_address: string | null;
  country: string | null;
  success: boolean;
  error_type: string | null;
  timestamp: string;
}

export interface BlacklistedHwid {
  hwid: string;
  reason: string | null;
  added_by: string | null;
  added_at: string;
}
