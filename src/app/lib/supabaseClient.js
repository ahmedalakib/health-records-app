import { createClient } from '@supabase/supabase-js';

// Production Supabase Cloud Credentials for Sanomed Health
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kdgfxkhtfeaoabwhykvq.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_4VwHbiV8pIE5PRAgX8nhcA_SRERoP1L';

// Supabase is permanently configured for the live production database
export const isSupabaseConfigured = true;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});