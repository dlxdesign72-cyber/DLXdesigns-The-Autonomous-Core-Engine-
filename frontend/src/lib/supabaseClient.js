import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL or ANON_KEY not set; frontend cannot query Supabase until env is configured');
}
export const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
