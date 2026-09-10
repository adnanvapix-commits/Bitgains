import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';
import { createOtpSession, OTP_CONTEXTS } from '../../../../lib/server/otpStore';
import { sendWithdrawalOTPEmail } from '../../../../lib/server/emailService';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const { amount, toAddress } = await req.json();
    if (!amount || !toAddress) return NextResponse.json({ success: false, message: 'Amount and address required' }, { status: 400 });
    const { data: wallet } = await getSupabaseAdmin().from('wallets').select('balance, staked_amount').eq('user_id', user!.id).single();
    if (!wallet) return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
    const available = wallet.balance - wallet.staked_amount;
    if (available < parseFloat(amount)) return NextResponse.json({ success: false, message: `Insufficient balance. Available: $${available.toFixed(2)}` }, { status: 400 });
    const { otp, expiresAt } = createOtpSession({ userId: user!.id, context: OTP_CONTEXTS.WITHDRAWAL, metadata: { amount: parseFloat(amount), toAddress } });
    await sendWithdrawalOTPEmail(user!.email, otp, user!.name, amount, toAddress);
    return NextResponse.json({ success: true, message: 'OTP sent to your email', data: { expiresIn: Math.round((expiresAt - Date.now()) / 1000), emailHint: user!.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
