import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../../lib/api-auth';
import { generateTransactionHash } from '../../../../../../lib/server/helpers';
import { FIRST_DEPOSIT_BONUS_PERCENT } from '../../../../../../lib/server/referralRewards';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;
  try {
    const { id } = await params;
    const { comment = '' } = await req.json().catch(() => ({}));
    const sb = getSupabaseAdmin();
    const { data: tx } = await sb.from('transactions').select('*, profiles!transactions_user_id_fkey(id, name, email)').eq('id', id).single();
    if (!tx) return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
    if (tx.status !== 'pending') return NextResponse.json({ success: false, message: `Transaction is already ${tx.status}` }, { status: 400 });
    const { data: wallet } = await sb.from('wallets').select('*').eq('user_id', tx.user_id).single();
    if (!wallet) return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
    const now = new Date().toISOString();
    const txHash = generateTransactionHash();
    if (tx.type === 'deposit') {
      const wasFirst = wallet.total_deposited === 0;
      await sb.from('wallets').update({ balance: wallet.balance + tx.amount, total_deposited: wallet.total_deposited + tx.amount }).eq('user_id', tx.user_id);
      await sb.from('transactions').update({ status: 'completed', reviewed_by: user!.id, reviewed_at: now, review_comment: comment, processing_at: now, completed_at: now, tx_hash: txHash }).eq('id', id);
      // First deposit bonus
      const { data: du } = await sb.from('profiles').select('referred_by, has_received_first_deposit_bonus, name, email').eq('id', tx.user_id).single();
      if (du?.referred_by && wasFirst && !du.has_received_first_deposit_bonus && FIRST_DEPOSIT_BONUS_PERCENT > 0) {
        const bonus = Math.round(tx.amount * FIRST_DEPOSIT_BONUS_PERCENT * 1e8) / 1e8;
        if (bonus > 0) {
          const { data: rw } = await sb.from('wallets').select('*').eq('user_id', du.referred_by).single();
          if (rw) {
            await sb.from('wallets').update({ balance: rw.balance + bonus, total_earnings: rw.total_earnings + bonus, referral_earnings_first_bonus: (rw.referral_earnings_first_bonus || 0) + bonus, referral_earnings_total: (rw.referral_earnings_total || 0) + bonus }).eq('user_id', du.referred_by);
            await sb.from('profiles').update({ has_received_first_deposit_bonus: true }).eq('id', tx.user_id);
            await sb.from('transactions').insert({ user_id: du.referred_by, type: 'first_deposit_bonus', amount: bonus, status: 'completed', description: `First deposit bonus from ${du.name || du.email}'s deposit`, metadata: { referredUserId: tx.user_id, sourceTransactionId: id } });
          }
        }
      }
    } else if (tx.type === 'withdrawal') {
      if (wallet.balance - wallet.staked_amount < tx.amount) return NextResponse.json({ success: false, message: 'Insufficient balance' }, { status: 400 });
      await sb.from('wallets').update({ balance: wallet.balance - tx.amount, total_withdrawn: wallet.total_withdrawn + tx.amount }).eq('user_id', tx.user_id);
      await sb.from('transactions').update({ status: 'completed', reviewed_by: user!.id, reviewed_at: now, review_comment: comment, processing_at: now, completed_at: now, tx_hash: txHash }).eq('id', id);
    }
    await sb.from('wallet_pending_transactions').delete().eq('transaction_id', id).catch(() => {});
    const { data: updated } = await sb.from('transactions').select('*').eq('id', id).single();
    return NextResponse.json({ success: true, message: `${tx.type} approved successfully`, data: { transaction: updated } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
