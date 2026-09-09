import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin().auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, role, is_active, referral_code')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ success: false, message: 'User profile not found' }, { status: 401 });
    }
    if (!profile.is_active) {
      return NextResponse.json({ success: false, message: 'Account has been deactivated' }, { status: 401 });
    }

    // Update last login in background
    getSupabaseAdmin().from('profiles').update({ last_login: new Date().toISOString() }).eq('id', data.user.id).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          isEmailVerified: data.user.email_confirmed_at != null,
          referralCode: profile.referral_code,
        },
        token: data.session!.access_token,
        refreshToken: data.session!.refresh_token,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ success: false, message: 'Error during login' }, { status: 500 });
  }
}
