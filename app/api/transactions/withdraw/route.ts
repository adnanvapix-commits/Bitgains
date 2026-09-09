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
    const withdrawAmount = parseFloat(amount);

    const validation = validateTransactionAmount(withdrawAmount, 'withdrawal');
    if (!validation.valid) return NextResponse.json({ success: false, message: validation.message }, { status: 400 });
    if (!toAddress || toAddress.length < 40) return NextResponse.json({ success: false, message: 'Invalid wallet address' }, { status: 400 });
    if (!otp || otp.length !== 6) return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });

    const verification = verifyOtpSession({ userId: user!.id, context: OTP_CONTEXTS.WITHDRAWAL, code: otp });
    if (!verification.success) {
      return NextResponse.json({ success: false, message: verification.message, requiresNewOTP: verification.needsNewOtp || false, attemptsRemaining: verification.attemptsRemaining }, { status: 400 });
    }

    const meta = verification.metadata || {};
    if (meta.amount !== withdrawAmount || meta.toAddress !== toAddress) {
      invalidateOtpSession({ userId: user!.id, context: OTP_CONTEXTS.WITHDRAWAL });
      return NextResponse.json({ success: false, message: 'Withdrawal details do not match OTP request.', requiresNewOTP: true }, { status: 400 });
    }

    const { data: wallet } = await getSupabaseAdmin().from('wallets').select('id, balance, staked_amount').eq('user_id', user!.id).single();
    if (!wallet) return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });

    const available = wallet.balance - wallet.staked_amount;
    if (available < withdrawAmount) return NextResponse.json({ success: false, message: `Insufficient balance. Available: ${available} ${currency}` }, { status: 400 });

    const feePercentage = parseFloat(process.env.TRANSACTION_FEE_PERCENTAGE || '0.5');
    const feeAmount = calculateFee(amount, feePercentage);

    const { data: tx, error: txError } = await getSupabaseAdmin().from('transactions').insert({
      user_id: user!.id,
      type: 'withdrawal',
      amount: withdrawAmount,
      currency,
      network,
      to_address: toAddress.toLowerCase(),
      description: description || `Withdrawal of ${amount} ${currency}`,
      fee_amount: feeAmount,
      fee_percentage: feePercentage,
      status: 'pending',
      metadata: { ipAddress: getClientIP(req), userAgent: getUserAgent(req) },
    }).select().single();
    if (txError) throw txError;

    await getSupabaseAdmin().from('wallet_pending_transactions').insert({ wallet_id: wallet.id, transaction_id: tx.id }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted. Awaiting admin approval.',
      data: { transaction: { id: tx.id, type: tx.type, amount: tx.amount, currency: tx.currency, network: tx.network, toAddress: tx.to_address, status: tx.status, submittedAt: tx.submitted_at } },
    }, { status: 201 });
  } catch (err) {
    console.error('Withdrawal error:', err);
    return NextResponse.json({ success: false, message: 'Error submitting withdrawal request' }, { status: 500 });
  }
}
