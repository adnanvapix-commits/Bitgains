import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';
import { calculateVariableReward, getCurrentStakingMonth, getMonthlyRate } from '../../../../lib/server/stakingRates';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const sb = getSupabaseAdmin();
    const uid = user!.id;

    // Get wallet - auto-create if missing
    let { data: wallet } = await sb.from('wallets').select('*').eq('user_id', uid).single();
    if (!wallet) {
      const { data: w } = await sb.from('wallets').insert({ user_id: uid, balance: 0, staked_amount: 0, total_earnings: 0, total_deposited: 0, total_withdrawn: 0, apr: 12.5 }).select('*').single();
      wallet = w;
    }
    if (!wallet) return NextResponse.json({ success: false, message: 'Failed to initialize wallet' }, { status: 500 });

    // Check matured stakes
    const now = new Date().toISOString();
    const { data: activeStakes } = await sb.from('stakes').select('*').eq('user_id', uid).eq('status', 'active');
    let totalReward = 0;
    const maturedStakes: any[] = [];

    for (const stake of (activeStakes || [])) {
      if (now >= stake.end_date) {
        const { reward } = calculateVariableReward(stake.amount, stake.start_date, stake.start_date, stake.end_date);
        totalReward += reward;
        maturedStakes.push({ stakeId: stake.stake_id, amount: stake.amount, rewards: reward, packageType: stake.package_type });
        await sb.from('stakes').update({ status: 'matured', actual_rewards: reward, matured_at: now }).eq('id', stake.id);
        const { data: existingReward } = await sb.from('transactions').select('id').eq('user_id', uid).eq('type', 'reward').contains('metadata', { stakeId: stake.stake_id }).maybeSingle();
        if (!existingReward) {
          await sb.from('transactions').insert({ user_id: uid, type: 'reward', amount: reward, currency: 'USDT', status: 'completed', description: `Stake matured: ${stake.package_type} stake of ${stake.amount} USDT`, completed_at: now, metadata: { stakeId: stake.stake_id, stakedAmount: stake.amount, packageType: stake.package_type } });
        }
      }
    }

    if (totalReward > 0) {
      await sb.from('wallets').update({ balance: wallet.balance + totalReward, staked_amount: Math.max(0, wallet.staked_amount - maturedStakes.reduce((s, m) => s + m.amount, 0)), total_earnings: wallet.total_earnings + totalReward, last_staking_update: now }).eq('user_id', uid);
    }

    // Fresh wallet
    const { data: fresh } = await sb.from('wallets').select('*').eq('user_id', uid).single();
    const { data: allStakes } = await sb.from('stakes').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    const w = fresh || wallet;
    const currentMonth = w.staking_start_date ? getCurrentStakingMonth(w.staking_start_date) : 1;
    const currentRate = getMonthlyRate(currentMonth);

    return NextResponse.json({
      success: true,
      data: {
        wallet: {
          balance: w.balance,
          stakedAmount: w.staked_amount,
          availableBalance: w.balance - w.staked_amount,
          totalEarnings: w.total_earnings,
          totalDeposited: w.total_deposited,
          totalWithdrawn: w.total_withdrawn,
          apr: w.apr,
          stakingStartDate: w.staking_start_date,
          lastStakingUpdate: w.last_staking_update,
          recentReward: totalReward,
          currentStakingMonth: currentMonth,
          currentMonthlyRate: currentRate,
          currentMonthlyRatePercent: `${(currentRate * 100).toFixed(0)}%`,
          stakes: (allStakes || []).map((s: any) => ({ stakeId: s.stake_id, amount: s.amount, startDate: s.start_date, endDate: s.end_date, packageType: s.package_type, status: s.status, expectedRewards: s.expected_rewards, actualRewards: s.actual_rewards, maturedAt: s.matured_at })),
          maturedStakes,
          createdAt: w.created_at,
          updatedAt: w.updated_at,
        },
      },
    });
  } catch (err: any) {
    console.error('Wallet error:', err);
    return NextResponse.json({ success: false, message: 'Failed to connect to wallet service' }, { status: 500 });
  }
}
