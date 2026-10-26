import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { createOtpSession } from '../../../../lib/server/otpStore';
import { sendSignupOTPEmail } from '../../../../lib/server/emailService';

// Temporary user ID for pre-signup OTP (email-based key)
const SIGNUP_OTP_PREFIX = 'signup:';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const name = (body.name || body.fullName || '').trim();

    if (!email) return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    if (!name)  return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });

    const sb = getSupabaseAdmin();

    // Check if email already registered
    const { data: existing } = await sb.from('profiles').select('id').eq('email', email).maybeSingle();
    if (existing) {
      return NextResponse.json({ success: false, message: 'An account with this email already exists' }, { status: 400 });
    }

    // Generate and store OTP using email as the "userId" key
    const { otp, expiresAt } = await createOtpSession({
      userId: `${SIGNUP_OTP_PREFIX}${email}`,
      context: 'signup',
      metadata: { email, name },
    });

    // Send OTP email
    await sendSignupOTPEmail(email, otp, name);

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email. Please check your inbox.',
      data: { expiresAt },
    });
  } catch (err: any) {
    console.error('send-signup-otp error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Failed to send OTP' }, { status: 500 });
  }
}
