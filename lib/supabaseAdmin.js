import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase Service Role environment variables');
}

// Create a Supabase client with the service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
