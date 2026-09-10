import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';
import { calculateVariableReward, getCurrentStakingMonth, getMonthlyRate } from '../../../../lib/server/stakingRates';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const { amount } = await req.json();
    const num = parseFloat(amount);
    if (!num || num <= 0) return NextResponse.json({ success: false, message: 'Invalid amount' }, { status: 400 });
    const sb = getSupabaseAdmin();
    const { data: wallet } = await sb.from('wallets').select('*').eq('user_id', user!.id).single();
    if (!wallet) return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
    if (wallet.staked_amount < num) return NextResponse.json({ success: false, message: `Insufficient staked. Staked: ${wallet.staked_amount} USDT` }, { status: 400 });
    const currentMonth = wallet.staking_start_date ? getCurrentStakingMonth(wallet.staking_start_date) : 1;
    const currentRate = getMonthlyRate(currentMonth);
    const { reward } = wallet.staking_start_date ? calculateVariableReward(num, wallet.staking_start_date, wallet.last_staking_update, new Date()) : { reward: 0 };
    const newStaked = wallet.staked_amount - num;
    await sb.from('wallets').update({ staked_amount: newStaked, balance: wallet.balance + reward, total_earnings: wallet.total_earnings + reward, last_staking_update: new Date().toISOString(), staking_start_date: newStaked === 0 ? null : wallet.staking_start_date }).eq('user_id', user!.id);
    const { data: tx } = await sb.from('transactions').insert({ user_id: user!.id, type: 'unstake', amount: num, currency: 'USDT', status: 'completed', description: `Unstaked ${num} USDT`, completed_at: new Date().toISOString() }).select().single();
    if (reward > 0) await sb.from('transactions').insert({ user_id: user!.id, type: 'reward', amount: reward, currency: 'USDT', status: 'completed', description: `Staking rewards (Month ${currentMonth} @ ${(currentRate * 100).toFixed(0)}%)`, completed_at: new Date().toISOString(), related_transaction_id: tx!.id });
    return NextResponse.json({ success: true, message: 'Funds unstaked successfully', data: { transaction: { id: tx!.id, type: tx!.type, amount: tx!.amount, status: tx!.status }, rewards: reward, wallet: { balance: wallet.balance + reward, stakedAmount: newStaked, availableBalance: wallet.balance + reward - newStaked } } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
