import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using service-role key (bypasses RLS)
// NEVER expose this to the browser — only import in API routes / server components
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
