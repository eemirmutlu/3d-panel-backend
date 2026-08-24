/**
 * src/config/supabase.ts
 *
 * Supabase client factory.
 *
 * Two separate clients are intentionally maintained:
 *
 * - `supabaseAnon`:  Uses the anon (public) key. Respects RLS policies.
 *                    Safe to use for operations tied to a specific user's session.
 *
 * - `supabaseAdmin`: Uses the service role key. Bypasses RLS.
 *                    MUST only be used server-side for privileged operations
 *                    (e.g., creating profiles after sign-up, admin actions).
 *                    NEVER expose this client or its key to the frontend.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';
import type { Database } from '../types/database.types';

// Typed aliases for clarity
type AppSupabaseClient = SupabaseClient<Database>;

let _anonClient: AppSupabaseClient | undefined;
let _adminClient: AppSupabaseClient | undefined;

/**
 * Returns a singleton Supabase client using the anon key.
 * Respects Row Level Security (RLS).
 */
export function getSupabaseAnon(): AppSupabaseClient {
  if (!_anonClient) {
    _anonClient = createClient<Database>(env.supabase.url, env.supabase.anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
  return _anonClient;
}

/**
 * Returns a singleton Supabase admin client using the service role key.
 * Bypasses Row Level Security — use with extreme caution.
 */
export function getSupabaseAdmin(): AppSupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient<Database>(env.supabase.url, env.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
  return _adminClient;
}
