import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resend = process.env.RESEND_API_KEY;

  // Test Supabase connection
  let supabaseStatus = 'not tested';
  try {
    if (url && serviceKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const client = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const { error } = await client.from('profiles').select('id').limit(1);
      supabaseStatus = error ? `ERROR: ${error.message}` : 'connected OK';
    } else {
      supabaseStatus = 'skipped - missing env vars';
    }
  } catch (e: any) {
    supabaseStatus = `EXCEPTION: ${e.message}`;
  }

  return NextResponse.json({
    status: 'ok',
    env: {
      NEXT_PUBLIC_SUPABASE_URL: url ? `SET (${url})` : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey ? `SET (${anonKey.substring(0, 20)}...)` : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: serviceKey ? `SET (${serviceKey.substring(0, 20)}...)` : 'MISSING',
      RESEND_API_KEY: resend ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV,
    },
    supabaseConnection: supabaseStatus,
  });
}
