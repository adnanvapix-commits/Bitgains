import { createClient } from '@supabase/supabase-js';

// Returns a fresh service-role client per request — safe for serverless
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      `Supabase env vars missing: URL=${url ? 'OK' : 'MISSING'} KEY=${key ? 'OK' : 'MISSING'}`
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Keep backward compat — lazy getter
export const supabaseAdmin = new Proxy({} as ReturnType<typeof getSupabaseAdmin>, {
  get(_t, prop) {
    return (getSupabaseAdmin() as any)[prop];
  },
});
