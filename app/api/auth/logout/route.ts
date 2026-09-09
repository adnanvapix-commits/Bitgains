import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (token) await supabaseAdmin.auth.admin.signOut(token).catch(() => {});
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch {
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  }
}
