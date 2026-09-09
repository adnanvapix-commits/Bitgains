import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { sendPasswordResetEmail } from '../../../../lib/server/emailService';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });

    // Always respond success (anti-enumeration)
    const response = NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });

    // Fire background email
    getSupabaseAdmin().from('profiles').select('id, name').eq('email', email.trim().toLowerCase()).single()
      .then(({ data: profile }) => {
        if (!profile) return;
        return getSupabaseAdmin().auth.admin.generateLink({
          type: 'recovery',
          email: email.trim().toLowerCase(),
          options: { redirectTo: `${process.env.FRONTEND_URL || 'https://bitgains.co'}/reset-password` },
        });
      })
      .then((result: any) => {
        if (result?.data?.properties?.hashed_token) {
          sendPasswordResetEmail(email, result.data.properties.hashed_token, '').catch(() => {});
        }
      })
      .catch(() => {});

    return response;
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ success: false, message: 'Error processing request' }, { status: 500 });
  }
}
