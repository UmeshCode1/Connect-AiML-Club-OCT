import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-supabase.aimlcluboct.in';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

/**
 * Client-safe Supabase instance for auth and public operations.
 * Service role keys are NEVER exposed to the frontend.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
