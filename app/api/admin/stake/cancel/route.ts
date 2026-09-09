import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminError = requireAdmin(user!);
  if (adminError) return adminError;

  try {
    const { userId, stakeId, reason } = await req.json();
    if (!userId || !reason) return NextResponse.json({ success: false, message: 'userId and reason are required' }, { status: 400 });

    const { data: targetUser } = await supabaseAdmin.from('profiles').select('email').eq('id', userId).single();
    if (!targetUser) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const { data: wallet } = await supabaseAdmin.from('wallets').select('*').eq('user_id', userId).single();
    if (!wallet) return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });

    let stakeQuery = supabaseAdmin.from('stakes').select('*').eq('user_id', userId).eq('status', 'active');
    if (stakeId) stakeQuery = stakeQuery.eq('stake_id', stakeId);
    const { data: activeStakes } = await stakeQuery;
    if (!activeStakes?.length) return NextResponse.json({ success: false, message: 'No active stakes found' }, { status: 400 });

    const penaltyRate = 0.1;
    let totalStaked = 0, totalPenalty = 0, totalReturn = 0;

    for (const stake of activeStakes) {
      const penalty = stake.amount * penaltyRate;
      const returned = stake.amount - penalty;
      totalStaked += stake.amount;
      totalPenalty += penalty;
      totalReturn += returned;

      await supabaseAdmin.from('stakes').update({ status: 'cancelled', matured_at: new Date().toISOString() }).eq('stake_id', stake.stake_id);
      await supabaseAdmin.from('transactions').insert({
        user_id: userId, type: 'early_cancellation_penalty', amount: penalty, status: 'completed',
        description: `Early stake cancellation penalty (10%)`, reviewed_by: user!.id, reviewed_at: new Date().toISOString(),
      });
    }

    await supabaseAdmin.from('wallets').update({
      staked_amount: Math.max(0, wallet.staked_amount - totalStaked),
      balance: wallet.balance + totalReturn,
      staking_start_date: null,
    }).eq('user_id', userId);

    await supabaseAdmin.from('transactions').insert({
      user_id: userId, type: 'unstake', amount: totalReturn, status: 'completed',
      description: `Admin cancelled stake - returned ${totalReturn} USDT after ${(penaltyRate * 100)}% penalty`,
      reviewed_by: user!.id, reviewed_at: new Date().toISOString(),
    });

    await supabaseAdmin.from('audit_logs').insert({
      admin_id: user!.id, admin_email: user!.email, target_user_id: userId, target_user_email: targetUser.email,
      action: 'CANCEL_STAKE', reason,
      metadata: { cancelledStakesCount: activeStakes.length, originalStakedAmount: totalStaked, penaltyAmount: totalPenalty, returnedToBalance: totalReturn },
    });

    return NextResponse.json({
      success: true,
      message: 'Stake cancelled successfully',
      data: { cancellation: { cancelledStakesCount: activeStakes.length, originalStakedAmount: totalStaked, penaltyAmount: totalPenalty, returnedToBalance: totalReturn } },
    });
  } catch (err) {
    console.error('Cancel stake error:', err);
    return NextResponse.json({ success: false, message: 'Error cancelling stake' }, { status: 500 });
  }
}
