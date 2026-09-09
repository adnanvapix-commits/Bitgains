import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';
import { calculateVariableReward, getCurrentStakingMonth, getMonthlyRate } from '../../../../lib/server/stakingRates';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const { data: wallet } = await supabaseAdmin.from('wallets').select('*, stakes(*)').eq('user_id', user!.id).single();
    if (!wallet) return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });

    const stakes = wallet.stakes || [];
    const now = new Date();
    let recentReward = 0;

    // Check for matured stakes and calculate rewards
    const maturedStakes = stakes.filter((s: any) => s.status === 'active' && new Date(s.end_date) <= now);
    for (const stake of maturedStakes) {
      const { reward } = calculateVariableReward(stake.amount, stake.start_date, stake.start_date, now);
      recentReward += reward;
      if (reward > 0) {
        await supabaseAdmin.from('wallets').update({
          balance: wallet.balance + reward,
          total_earnings: wallet.total_earnings + reward,
          last_staking_update: now.toISOString(),
        }).eq('user_id', user!.id);
        await supabaseAdmin.from('transactions').insert({
          user_id: user!.id, type: 'reward', amount: reward, currency: 'USDT', status: 'completed',
          description: `Staking rewards matured`, completed_at: now.toISOString(),
        });
      }
      await supabaseAdmin.from('stakes').update({ status: 'matured', matured_at: now.toISOString() }).eq('stake_id', stake.stake_id);
    }

    const currentMonth = wallet.staking_start_date ? getCurrentStakingMonth(wallet.staking_start_date) : 1;
    const currentRate = getMonthlyRate(currentMonth);

    return NextResponse.json({
      success: true,
      data: {
        wallet: {
          balance: wallet.balance,
          stakedAmount: wallet.staked_amount,
          availableBalance: wallet.balance - wallet.staked_amount,
          totalEarnings: wallet.total_earnings,
          totalDeposited: wallet.total_deposited,
          totalWithdrawn: wallet.total_withdrawn,
          apr: wallet.apr,
          stakingStartDate: wallet.staking_start_date,
          lastStakingUpdate: wallet.last_staking_update,
          recentReward,
          currentStakingMonth: currentMonth,
          currentMonthlyRate: currentRate,
          currentMonthlyRatePercent: `${(currentRate * 100).toFixed(0)}%`,
          stakes: stakes.map((s: any) => ({ stakeId: s.stake_id, amount: s.amount, packageType: s.package_type, status: s.status, startDate: s.start_date, endDate: s.end_date })),
          maturedStakes: maturedStakes.map((s: any) => s.stake_id),
        },
      },
    });
  } catch (err) {
    console.error('Wallet error:', err);
    return NextResponse.json({ success: false, message: 'Error fetching wallet' }, { status: 500 });
  }
}
