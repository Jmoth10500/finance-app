import { createClient } from '@supabase/supabase-js';

/**
 * Lazily create a browser-only Supabase client.
 * This avoids reading NEXT_PUBLIC_* during the server build.
 */
export function supabaseBrowser() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    // If someone accidentally calls this on the server, fail loudly.
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient(url, anon);
}
