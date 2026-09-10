import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { sendPasswordResetSuccessEmail } from '../../../../lib/server/emailService';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password || password.length < 6)
      return NextResponse.json({ success: false, message: 'Token and valid password required' }, { status: 400 });
    const sb = getSupabaseAdmin();
    const { data: v, error } = await sb.auth.verifyOtp({ token_hash: token, type: 'recovery' });
    if (error || !v.user) return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 400 });
    await sb.auth.admin.updateUserById(v.user.id, { password });
    const { data: profile } = await sb.from('profiles').select('email, name').eq('id', v.user.id).single();
    if (profile) sendPasswordResetSuccessEmail(profile.email, profile.name).catch(() => {});
    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
