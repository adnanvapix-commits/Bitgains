import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using service-role key (bypasses RLS)
// NEVER expose this to the browser — only import in API routes / server components

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!url || !key) {
  console.error(
    `[supabase-server] MISSING ENV VARS — NEXT_PUBLIC_SUPABASE_URL: ${url ? 'OK' : 'MISSING'}, SUPABASE_SERVICE_ROLE_KEY: ${key ? 'OK' : 'MISSING'}`
  );
}

export const supabaseAdmin = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder', {
  auth: { autoRefreshToken: false, persistSession: false },
});
