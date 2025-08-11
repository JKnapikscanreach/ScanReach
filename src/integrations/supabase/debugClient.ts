import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { createDebugSupabaseClient } from '@/utils/debugWrapper';

const baseClient = createClient<Database>(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const createDebugClient = (addDebugEntry: any) => {
  return createDebugSupabaseClient(baseClient, addDebugEntry);
};

export { baseClient };