import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { createDebugSupabaseClient } from '@/utils/debugWrapper';

const SUPABASE_URL = "https://omglnkwppbzviojlnlxm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tZ2xua3dwcGJ6dmlvamxubHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzEwNzcsImV4cCI6MjA2OTM0NzA3N30.f4bQp1rK1lmBbOOf8y4SH1aGPw02ih4vNxpNEPOe2zQ";

const baseClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// This function creates a debug-wrapped client
export const createDebugClient = (addDebugEntry: any) => {
  return createDebugSupabaseClient(baseClient, addDebugEntry);
};

// Export the base client for cases where debug is not needed
export { baseClient };