import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client using service-role key (bypasses RLS)
// NEVER expose this to the browser — only import in API routes / server components

let _client: SupabaseClient | null = null;

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_client) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!url || !key) {
        throw new Error(
          `Missing Supabase env vars. NEXT_PUBLIC_SUPABASE_URL=${url ? 'set' : 'MISSING'}, SUPABASE_SERVICE_ROLE_KEY=${key ? 'set' : 'MISSING'}`
        );
      }

      _client = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
    return (_client as any)[prop];
  },
});
