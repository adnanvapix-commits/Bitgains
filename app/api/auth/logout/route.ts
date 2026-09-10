import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function POST(req: NextRequest) {
  const { error } = await getAuthUser(req);
  if (error) return NextResponse.json({ success: true });
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (token) await getSupabaseAdmin().auth.admin.signOut(token).catch(() => {});
  } catch {}
  return NextResponse.json({ success: true, message: 'Logged out' });
}
