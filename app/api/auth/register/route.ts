import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { sendEmailVerificationEmail } from '../../../../lib/server/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, referralCode } = body;
    const name = body.name || body.fullName || '';

    // Basic validation
    if (!email || !password || !name) {
      return NextResponse.json({ success: false, message: 'Email, password and name are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json({ success: false, message: 'Password must contain uppercase, lowercase and a number' }, { status: 400 });
    }
    if (name.trim().length < 2 || name.trim().length > 50) {
      return NextResponse.json({ success: false, message: 'Name must be 2–50 characters' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Resolve referral chain
    let referredBy = null, referredByLevel2 = null, referredByLevel3 = null, referralLevel = 0;
    if (referralCode?.trim()) {
      const code = referralCode.trim().toUpperCase();
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id, referred_by, referred_by_level2')
        .eq('referral_code', code)
        .single();
      if (referrer) {
        referredBy = referrer.id;
        referralLevel = 1;
        if (referrer.referred_by) {
          referredByLevel2 = referrer.referred_by;
          referralLevel = 2;
          const { data: l2 } = await supabase.from('profiles').select('referred_by').eq('id', referrer.referred_by).single();
          if (l2?.referred_by) { referredByLevel3 = l2.referred_by; referralLevel = 3; }
        }
      }
    }

    // Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (signUpError) {
      if (signUpError.message?.toLowerCase().includes('already registered') || signUpError.message?.toLowerCase().includes('already been registered')) {
        return NextResponse.json({ success: false, message: 'User already exists with this email' }, { status: 400 });
      }
      console.error('Supabase createUser error:', signUpError);
      return NextResponse.json({ success: false, message: signUpError.message || 'Error creating account' }, { status: 400 });
    }

    const userId = authData.user.id;

    // Update profile with name + referral data (trigger creates the row)
    await supabase.from('profiles').update({
      name: name.trim(),
      referred_by: referredBy,
      referred_by_level2: referredByLevel2,
      referred_by_level3: referredByLevel3,
      referral_level: referralLevel,
    }).eq('id', userId);

    // Update referrer count
    if (referredBy) {
      const { data: refProfile } = await supabase.from('profiles').select('referral_count').eq('id', referredBy).single();
      if (refProfile) {
        await supabase.from('profiles').update({ referral_count: (refProfile.referral_count || 0) + 1 }).eq('id', referredBy);
      }
    }

    // Sign in to get session token
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({ email, password });
    if (sessionError) {
      console.error('Session error after register:', sessionError);
      return NextResponse.json({ success: false, message: 'Account created but login failed. Please login manually.' }, { status: 201 });
    }

    const { data: profile } = await supabase.from('profiles').select('id, email, name, role, referral_code').eq('id', userId).single();

    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      data: {
        user: {
          id: profile?.id || userId,
          email: profile?.email || email,
          name: profile?.name || name,
          role: profile?.role || 'user',
          isEmailVerified: true,
          referralCode: profile?.referral_code || null,
        },
        token: sessionData.session!.access_token,
        refreshToken: sessionData.session!.refresh_token,
      },
    }, { status: 201 });

  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Error creating user account' }, { status: 500 });
  }
}
