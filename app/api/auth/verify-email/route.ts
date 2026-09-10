import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ success: false, message: 'Token required' }, { status: 400 });
    const { error } = await getSupabaseAdmin().auth.verifyOtp({ token_hash: token, type: 'email' });
    if (error) return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 400 });
    return NextResponse.json({ success: true, message: 'Email verified successfully' });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
