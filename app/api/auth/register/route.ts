import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { sendEmailVerificationEmail } from '../../../../lib/server/emailService';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, referralCode } = await req.json();

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

    // Resolve referral chain
    let referredBy = null, referredByLevel2 = null, referredByLevel3 = null, referralLevel = 0;
    if (referralCode?.trim()) {
      const code = referralCode.trim().toUpperCase();
      const { data: referrer } = await supabaseAdmin
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
          const { data: l2 } = await supabaseAdmin.from('profiles').select('referred_by').eq('id', referrer.referred_by).single();
          if (l2?.referred_by) { referredByLevel3 = l2.referred_by; referralLevel = 3; }
        }
      }
    }

    // Create auth user
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { name },
    });
    if (signUpError) {
      if (signUpError.message?.includes('already registered')) {
        return NextResponse.json({ success: false, message: 'User already exists with this email' }, { status: 400 });
      }
      throw signUpError;
    }

    const userId = authData.user.id;

    // Update profile with referral data
    await supabaseAdmin.from('profiles').update({
      name: name.trim(),
      referred_by: referredBy,
      referred_by_level2: referredByLevel2,
      referred_by_level3: referredByLevel3,
      referral_level: referralLevel,
    }).eq('id', userId);

    // Update referrer count
    if (referredBy) {
      const { data: refProfile } = await supabaseAdmin.from('profiles').select('referral_count').eq('id', referredBy).single();
      if (refProfile) {
        await supabaseAdmin.from('profiles').update({ referral_count: (refProfile.referral_count || 0) + 1 }).eq('id', referredBy);
      }
    }

    // Sign in to get session
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (sessionError) throw sessionError;

    const { data: profile } = await supabaseAdmin.from('profiles').select('id, email, name, role, referral_code').eq('id', userId).single();

    // Send verification email in background
    supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      options: { redirectTo: `${process.env.FRONTEND_URL || 'https://bitgains.co'}/verify-email` },
    }).then(({ data: linkData }) => {
      if (linkData?.properties?.hashed_token) {
        sendEmailVerificationEmail(email, linkData.properties.hashed_token, name).catch(() => {});
      }
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: profile!.id,
          email: profile!.email,
          name: profile!.name,
          role: profile!.role,
          isEmailVerified: false,
          referralCode: profile!.referral_code,
        },
        token: sessionData.session!.access_token,
        refreshToken: sessionData.session!.refresh_token,
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json({ success: false, message: 'Error creating user account' }, { status: 500 });
  }
}
