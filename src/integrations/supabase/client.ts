import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate environment variables with more helpful error messages
if (!SUPABASE_URL) {
  throw new Error(
    'VITE_SUPABASE_URL is required. Please check your .env file.'
  );
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'VITE_SUPABASE_PUBLISHABLE_KEY is required. Please check your .env file.'
  );
}

// Enhanced configuration with better error handling
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
    detectSessionInUrl: true, // Important for OAuth callbacks
    debug: import.meta.env.DEV ? true : false, // Enable auth debug logs in development
  },
  global: {
    headers: {
      'X-Client-Info': 'sale-stream-link@1.0.0'
    }
  },
  // Add realtime configuration if you use subscriptions
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});