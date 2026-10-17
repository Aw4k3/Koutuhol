import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Prevent client crash if .env.local hasn't been loaded or has placeholder text
  if (!url || !key || !url.startsWith('http')) {
    return null;
  }

  return createBrowserClient(url, key);
}