import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();
    if (!refreshToken) return NextResponse.json({ success: false, message: 'Refresh token required' }, { status: 401 });
    const { data, error } = await getSupabaseAdmin().auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) return NextResponse.json({ success: false, message: 'Invalid refresh token' }, { status: 401 });
    return NextResponse.json({ success: true, data: { token: data.session.access_token, refreshToken: data.session.refresh_token } });
  } catch { return NextResponse.json({ success: false, message: 'Invalid refresh token' }, { status: 401 }); }
}
