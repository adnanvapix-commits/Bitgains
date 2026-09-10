import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';
import { verifyOtpSession, invalidateOtpSession, OTP_CONTEXTS } from '../../../../lib/server/otpStore';
import { validateTransactionAmount, calculateFee, getClientIP, getUserAgent } from '../../../../lib/server/helpers';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const { amount, toAddress, otp, currency = 'USDT', network = 'ERC-20', description } = await req.json();
    const num = parseFloat(amount);
    const v = validateTransactionAmount(num, 'withdrawal');
    if (!v.valid) return NextResponse.json({ success: false, message: v.message }, { status: 400 });
    if (!otp) return NextResponse.json({ success: false, message: 'OTP required' }, { status: 400 });
    const verification = verifyOtpSession({ userId: user!.id, context: OTP_CONTEXTS.WITHDRAWAL, code: otp });
    if (!verification.success) return NextResponse.json({ success: false, message: verification.message, requiresNewOTP: verification.needsNewOtp, attemptsRemaining: verification.attemptsRemaining }, { status: 400 });
    const meta = verification.metadata || {};
    if (meta.amount !== num || meta.toAddress !== toAddress) {
      invalidateOtpSession({ userId: user!.id, context: OTP_CONTEXTS.WITHDRAWAL });
      return NextResponse.json({ success: false, message: 'Withdrawal details do not match OTP request.', requiresNewOTP: true }, { status: 400 });
    }
    const sb = getSupabaseAdmin();
    const { data: wallet } = await sb.from('wallets').select('id, balance, staked_amount').eq('user_id', user!.id).single();
    if (!wallet) return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
    if (wallet.balance - wallet.staked_amount < num) return NextResponse.json({ success: false, message: 'Insufficient balance' }, { status: 400 });
    const feePct = parseFloat(process.env.TRANSACTION_FEE_PERCENTAGE || '0.5');
    const { data: tx, error: txErr } = await sb.from('transactions').insert({ user_id: user!.id, type: 'withdrawal', amount: num, currency, network, to_address: toAddress.toLowerCase(), description: description || `Withdrawal of ${amount} ${currency}`, fee_amount: calculateFee(num, feePct), fee_percentage: feePct, status: 'pending', metadata: { ipAddress: getClientIP(req), userAgent: getUserAgent(req) } }).select().single();
    if (txErr) throw txErr;
    await sb.from('wallet_pending_transactions').insert({ wallet_id: wallet.id, transaction_id: tx.id }).catch(() => {});
    return NextResponse.json({ success: true, message: 'Withdrawal request submitted. Awaiting admin approval.', data: { transaction: { id: tx.id, type: tx.type, amount: tx.amount, currency: tx.currency, network: tx.network, toAddress: tx.to_address, status: tx.status, submittedAt: tx.submitted_at } } }, { status: 201 });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
