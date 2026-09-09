import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';
import { validateTransactionAmount, calculateFee, getClientIP, getUserAgent } from '../../../../lib/server/helpers';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const { amount, currency = 'USDT', network = 'ERC-20', fromAddress, description, userTransactionId } = await req.json();
    const numAmount = parseFloat(amount);
    const validation = validateTransactionAmount(numAmount, 'deposit');
    if (!validation.valid) return NextResponse.json({ success: false, message: validation.message }, { status: 400 });

    const { data: wallet } = await supabaseAdmin.from('wallets').select('id').eq('user_id', user!.id).single();
    if (!wallet) return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });

    const feePercentage = parseFloat(process.env.TRANSACTION_FEE_PERCENTAGE || '0');
    const feeAmount = calculateFee(numAmount, feePercentage);

    const { data: tx, error: txError } = await supabaseAdmin.from('transactions').insert({
      user_id: user!.id,
      type: 'deposit',
      amount: numAmount,
      currency,
      network,
      from_address: fromAddress,
      user_transaction_id: userTransactionId || null,
      description: description || `Deposit of ${amount} ${currency}`,
      fee_amount: feeAmount,
      fee_percentage: feePercentage,
      status: 'pending',
      metadata: { ipAddress: getClientIP(req), userAgent: getUserAgent(req) },
    }).select().single();
    if (txError) throw txError;

    await supabaseAdmin.from('wallet_pending_transactions').insert({ wallet_id: wallet.id, transaction_id: tx.id }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Deposit request submitted. Awaiting admin approval.',
      data: { transaction: { id: tx.id, type: tx.type, amount: tx.amount, currency: tx.currency, network: tx.network, status: tx.status, submittedAt: tx.submitted_at } },
    }, { status: 201 });
  } catch (err) {
    console.error('Deposit error:', err);
    return NextResponse.json({ success: false, message: 'Error submitting deposit request' }, { status: 500 });
  }
}
