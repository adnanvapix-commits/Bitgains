import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password)
      return NextResponse.json({ success: false, message: 'Email and password required' }, { status: 400 });

    const sb = getSupabaseAdmin();
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });

    const { data: profile } = await sb.from('profiles').select('id, email, name, role, is_active, referral_code').eq('id', data.user.id).single();
    if (!profile) return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 401 });
    if (!profile.is_active) return NextResponse.json({ success: false, message: 'Account deactivated' }, { status: 401 });

    sb.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', data.user.id).catch(() => {});

    return NextResponse.json({
      success: true, message: 'Login successful',
      data: {
        user: { id: profile.id, email: profile.email, name: profile.name, role: profile.role, isEmailVerified: data.user.email_confirmed_at != null, referralCode: profile.referral_code },
        token: data.session!.access_token,
        refreshToken: data.session!.refresh_token,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
