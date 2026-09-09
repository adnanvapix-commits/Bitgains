import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../../lib/api-auth';
import { generateTransactionHash } from '../../../../../../lib/server/helpers';
import { FIRST_DEPOSIT_BONUS_PERCENT } from '../../../../../../lib/server/referralRewards';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminError = requireAdmin(user!);
  if (adminError) return adminError;

  try {
    const { id } = await params;
    const { comment = '' } = await req.json().catch(() => ({}));

    const { data: tx } = await supabaseAdmin.from('transactions')
      .select('*, profiles!transactions_user_id_fkey(id, name, email)')
      .eq('id', id).single();
    if (!tx) return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
    if (tx.status !== 'pending') return NextResponse.json({ success: false, message: `Transaction is already ${tx.status}` }, { status: 400 });

    const userId = tx.user_id;
    const { data: wallet } = await supabaseAdmin.from('wallets').select('*').eq('user_id', userId).single();
    if (!wallet) return NextResponse.json({ success: false, message: 'User wallet not found' }, { status: 404 });

    const txHash = generateTransactionHash();
    const now = new Date().toISOString();

    if (tx.type === 'deposit') {
      const wasFirstDeposit = wallet.total_deposited === 0;
      await supabaseAdmin.from('wallets').update({
        balance: wallet.balance + tx.amount,
        total_deposited: wallet.total_deposited + tx.amount,
      }).eq('user_id', userId);

      await supabaseAdmin.from('transactions').update({
        status: 'completed', reviewed_by: user!.id, reviewed_at: now,
        review_comment: comment, processing_at: now, completed_at: now, tx_hash: txHash,
      }).eq('id', id);

      // First deposit bonus
      const { data: depositUser } = await supabaseAdmin.from('profiles')
        .select('referred_by, has_received_first_deposit_bonus, name, email').eq('id', userId).single();
      if (depositUser?.referred_by && wasFirstDeposit && !depositUser.has_received_first_deposit_bonus && FIRST_DEPOSIT_BONUS_PERCENT > 0) {
        const bonusAmount = Math.round(tx.amount * FIRST_DEPOSIT_BONUS_PERCENT * 100000000) / 100000000;
        if (bonusAmount > 0) {
          const { data: referrerWallet } = await supabaseAdmin.from('wallets').select('*').eq('user_id', depositUser.referred_by).single();
          if (referrerWallet) {
            await supabaseAdmin.from('wallets').update({
              balance: referrerWallet.balance + bonusAmount,
              total_earnings: referrerWallet.total_earnings + bonusAmount,
              referral_earnings_first_bonus: (referrerWallet.referral_earnings_first_bonus || 0) + bonusAmount,
              referral_earnings_total: (referrerWallet.referral_earnings_total || 0) + bonusAmount,
            }).eq('user_id', depositUser.referred_by);
            await supabaseAdmin.from('profiles').update({ has_received_first_deposit_bonus: true }).eq('id', userId);
            await supabaseAdmin.from('transactions').insert({
              user_id: depositUser.referred_by, type: 'first_deposit_bonus', amount: bonusAmount, status: 'completed',
              description: `First deposit bonus from ${depositUser.name || depositUser.email}'s deposit`,
              metadata: { referredUserId: userId, sourceTransactionId: id },
            });
          }
        }
      }
    } else if (tx.type === 'withdrawal') {
      const available = wallet.balance - wallet.staked_amount;
      if (available < tx.amount) return NextResponse.json({ success: false, message: 'Insufficient balance for withdrawal' }, { status: 400 });
      await supabaseAdmin.from('wallets').update({
        balance: wallet.balance - tx.amount,
        total_withdrawn: wallet.total_withdrawn + tx.amount,
      }).eq('user_id', userId);
      await supabaseAdmin.from('transactions').update({
        status: 'completed', reviewed_by: user!.id, reviewed_at: now,
        review_comment: comment, processing_at: now, completed_at: now, tx_hash: txHash,
      }).eq('id', id);
    }

    await supabaseAdmin.from('wallet_pending_transactions').delete().eq('transaction_id', id).catch(() => {});
    const { data: updatedTx } = await supabaseAdmin.from('transactions').select('*').eq('id', id).single();

    return NextResponse.json({
      success: true,
      message: `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} approved successfully`,
      data: { transaction: updatedTx },
    });
  } catch (err) {
    console.error('Approve transaction error:', err);
    return NextResponse.json({ success: false, message: 'Error approving transaction' }, { status: 500 });
  }
}
