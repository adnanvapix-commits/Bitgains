import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;
  try {
    const { userId, stakeId, reason } = await req.json();
    if (!userId || !reason) return NextResponse.json({ success: false, message: 'userId and reason required' }, { status: 400 });
    const sb = getSupabaseAdmin();
    const { data: target } = await sb.from('profiles').select('email').eq('id', userId).single();
    if (!target) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    const { data: wallet } = await sb.from('wallets').select('*').eq('user_id', userId).single();
    if (!wallet) return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
    let q = sb.from('stakes').select('*').eq('user_id', userId).eq('status', 'active');
    if (stakeId) q = q.eq('stake_id', stakeId);
    const { data: stakes } = await q;
    if (!stakes?.length) return NextResponse.json({ success: false, message: 'No active stakes' }, { status: 400 });
    const PENALTY = 0.1;
    let totalStaked = 0, totalPenalty = 0, totalReturn = 0;
    for (const s of stakes) {
      const penalty = s.amount * PENALTY;
      totalStaked += s.amount; totalPenalty += penalty; totalReturn += s.amount - penalty;
      await sb.from('stakes').update({ status: 'cancelled', matured_at: new Date().toISOString() }).eq('stake_id', s.stake_id);
      await sb.from('transactions').insert({ user_id: userId, type: 'early_cancellation_penalty', amount: penalty, status: 'completed', description: `Early stake cancellation penalty (10%)`, reviewed_by: user!.id, reviewed_at: new Date().toISOString() });
    }
    await sb.from('wallets').update({ staked_amount: Math.max(0, wallet.staked_amount - totalStaked), balance: wallet.balance + totalReturn, staking_start_date: null }).eq('user_id', userId);
    await sb.from('transactions').insert({ user_id: userId, type: 'unstake', amount: totalReturn, status: 'completed', description: `Admin cancelled stake - returned ${totalReturn} USDT after 10% penalty`, reviewed_by: user!.id, reviewed_at: new Date().toISOString() });
    await sb.from('audit_logs').insert({ admin_id: user!.id, admin_email: user!.email, target_user_id: userId, target_user_email: target.email, action: 'CANCEL_STAKE', reason, metadata: { cancelledStakesCount: stakes.length, originalStakedAmount: totalStaked, penaltyAmount: totalPenalty, returnedToBalance: totalReturn } });
    return NextResponse.json({ success: true, message: 'Stake cancelled', data: { cancellation: { cancelledStakesCount: stakes.length, originalStakedAmount: totalStaked, penaltyAmount: totalPenalty, returnedToBalance: totalReturn } } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
