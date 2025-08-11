import { config } from 'dotenv';
import { execSync } from 'child_process';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

// Get the SUPABASE_URL from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;

// Check if SUPABASE_URL is defined
if (!supabaseUrl) {
    console.error('VITE_SUPABASE_URL is not defined in the environment variables.');
    process.exit(1);
}

// Call the npx script using the VITE_SUPABASE_URL
try {
    const supabaseIdFromUrl = supabaseUrl.replace('https://', '').split('.')[0];
    const thisPath = resolve();
    execSync(`npx supabase gen types typescript --project-id ${supabaseIdFromUrl} > ${thisPath}/src/integrations/supabase/types.ts`, { stdio: 'inherit' });
} catch (error) {
    console.error('Failed to execute the npx script:', error);
    process.exit(1);
}