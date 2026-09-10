import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';
import { validateTransactionAmount, calculateFee, getClientIP, getUserAgent } from '../../../../lib/server/helpers';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const { amount, currency = 'USDT', network = 'ERC-20', fromAddress, description, userTransactionId } = await req.json();
    const num = parseFloat(amount);
    const v = validateTransactionAmount(num, 'deposit');
    if (!v.valid) return NextResponse.json({ success: false, message: v.message }, { status: 400 });
    const sb = getSupabaseAdmin();
    const { data: wallet } = await sb.from('wallets').select('id').eq('user_id', user!.id).single();
    if (!wallet) return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
    const feePct = parseFloat(process.env.TRANSACTION_FEE_PERCENTAGE || '0');
    const { data: tx, error: txErr } = await sb.from('transactions').insert({ user_id: user!.id, type: 'deposit', amount: num, currency, network, from_address: fromAddress, user_transaction_id: userTransactionId || null, description: description || `Deposit of ${amount} ${currency}`, fee_amount: calculateFee(num, feePct), fee_percentage: feePct, status: 'pending', metadata: { ipAddress: getClientIP(req), userAgent: getUserAgent(req) } }).select().single();
    if (txErr) throw txErr;
    await sb.from('wallet_pending_transactions').insert({ wallet_id: wallet.id, transaction_id: tx.id }).catch(() => {});
    return NextResponse.json({ success: true, message: 'Deposit request submitted. Awaiting admin approval.', data: { transaction: { id: tx.id, type: tx.type, amount: tx.amount, currency: tx.currency, network: tx.network, status: tx.status, submittedAt: tx.submitted_at } } }, { status: 201 });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
