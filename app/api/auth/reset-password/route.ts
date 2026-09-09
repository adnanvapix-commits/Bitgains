import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { sendPasswordResetSuccessEmail } from '../../../../lib/server/emailService';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ success: false, message: 'Token and password are required' }, { status: 400 });
    }
    if (password.length < 6 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json({ success: false, message: 'Password must be 6+ chars with uppercase, lowercase and a number' }, { status: 400 });
    }

    // Verify the OTP/token
    const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    });
    if (verifyError || !verifyData.user) {
      return NextResponse.json({ success: false, message: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(verifyData.user.id, { password });
    if (updateError) throw updateError;

    // Send success email in background
    const { data: profile } = await supabaseAdmin.from('profiles').select('email, name').eq('id', verifyData.user.id).single();
    if (profile) sendPasswordResetSuccessEmail(profile.email, profile.name).catch(() => {});

    return NextResponse.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ success: false, message: 'Error resetting password' }, { status: 500 });
  }
}
