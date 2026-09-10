import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const name = (body.name || body.fullName || '').trim();
    const referralCode = body.referralCode?.trim().toUpperCase();

    if (!email || !password || !name)
      return NextResponse.json({ success: false, message: 'Email, password and name are required' }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      return NextResponse.json({ success: false, message: 'Password must contain uppercase, lowercase and a number' }, { status: 400 });
    if (name.length < 2 || name.length > 50)
      return NextResponse.json({ success: false, message: 'Name must be 2–50 characters' }, { status: 400 });

    const sb = getSupabaseAdmin();

    // Resolve referral chain
    let referredBy = null, referredByLevel2 = null, referredByLevel3 = null, referralLevel = 0;
    if (referralCode) {
      const { data: referrer } = await sb.from('profiles').select('id, referred_by, referred_by_level2').eq('referral_code', referralCode).single();
      if (referrer) {
        referredBy = referrer.id; referralLevel = 1;
        if (referrer.referred_by) {
          referredByLevel2 = referrer.referred_by; referralLevel = 2;
          const { data: l2 } = await sb.from('profiles').select('referred_by').eq('id', referrer.referred_by).single();
          if (l2?.referred_by) { referredByLevel3 = l2.referred_by; referralLevel = 3; }
        }
      }
    }

    // Create Supabase Auth user
    const { data: authData, error: signUpError } = await sb.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { name },
    });
    if (signUpError) {
      const msg = signUpError.message?.toLowerCase() || '';
      if (msg.includes('already') || msg.includes('exists'))
        return NextResponse.json({ success: false, message: 'An account with this email already exists' }, { status: 400 });
      return NextResponse.json({ success: false, message: signUpError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // Update profile row (created by trigger)
    await sb.from('profiles').update({
      name, referred_by: referredBy, referred_by_level2: referredByLevel2,
      referred_by_level3: referredByLevel3, referral_level: referralLevel,
    }).eq('id', userId);

    // Ensure wallet exists
    const { data: existingWallet } = await sb.from('wallets').select('id').eq('user_id', userId).single();
    if (!existingWallet) {
      await sb.from('wallets').insert({ user_id: userId, balance: 0, staked_amount: 0, total_earnings: 0, total_deposited: 0, total_withdrawn: 0, apr: 12.5 });
    }

    // Update referrer count
    if (referredBy) {
      const { data: rp } = await sb.from('profiles').select('referral_count').eq('id', referredBy).single();
      if (rp) await sb.from('profiles').update({ referral_count: (rp.referral_count || 0) + 1 }).eq('id', referredBy);
    }

    // Sign in to get session
    const { data: session, error: sessionError } = await sb.auth.signInWithPassword({ email, password });
    if (sessionError) return NextResponse.json({ success: false, message: 'Account created. Please login.' }, { status: 201 });

    const { data: profile } = await sb.from('profiles').select('id, email, name, role, referral_code').eq('id', userId).single();

    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      data: {
        user: { id: profile?.id || userId, email: profile?.email || email, name: profile?.name || name, role: profile?.role || 'user', isEmailVerified: true, referralCode: profile?.referral_code || null },
        token: session.session!.access_token,
        refreshToken: session.session!.refresh_token,
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Error creating account' }, { status: 500 });
  }
}
