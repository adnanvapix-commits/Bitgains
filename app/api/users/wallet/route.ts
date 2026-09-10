import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';
import { calculateVariableReward, getCurrentStakingMonth, getMonthlyRate } from '../../../../lib/server/stakingRates';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const supabase = getSupabaseAdmin();
    let { data: wallet } = await supabase.from('wallets').select('*, stakes(*)').eq('user_id', user!.id).single();

    // Auto-create wallet if it doesn't exist (trigger may not have run)
    if (!wallet) {
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({
          user_id: user!.id,
          balance: 0,
          staked_amount: 0,
          total_earnings: 0,
          total_deposited: 0,
          total_withdrawn: 0,
          apr: 12.5,
        })
        .select('*, stakes(*)')
        .single();

      if (createError) {
        console.error('Wallet create error:', createError);
        return NextResponse.json({ success: false, message: 'Failed to initialize wallet' }, { status: 500 });
      }
      wallet = newWallet;
    }

    const stakes = wallet.stakes || [];
    const now = new Date();
    let recentReward = 0;

    // Check for matured stakes and credit rewards
    const maturedStakes = stakes.filter((s: any) => s.status === 'active' && new Date(s.end_date) <= now);
    for (const stake of maturedStakes) {
      const { reward } = calculateVariableReward(stake.amount, stake.start_date, stake.start_date, now);
      recentReward += reward;
      if (reward > 0) {
        await supabase.from('wallets').update({
          balance: wallet.balance + reward,
          total_earnings: wallet.total_earnings + reward,
          last_staking_update: now.toISOString(),
        }).eq('user_id', user!.id);
        await supabase.from('transactions').insert({
          user_id: user!.id, type: 'reward', amount: reward, currency: 'USDT', status: 'completed',
          description: 'Staking rewards matured', completed_at: now.toISOString(),
        });
      }
      await supabase.from('stakes').update({ status: 'matured', matured_at: now.toISOString() }).eq('stake_id', stake.stake_id);
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
          stakes: stakes.map((s: any) => ({
            stakeId: s.stake_id,
            amount: s.amount,
            packageType: s.package_type,
            status: s.status,
            startDate: s.start_date,
            endDate: s.end_date,
          })),
          maturedStakes: maturedStakes.map((s: any) => s.stake_id),
        },
      },
    });
  } catch (err) {
    console.error('Wallet error:', err);
    return NextResponse.json({ success: false, message: 'Failed to connect to wallet service' }, { status: 500 });
  }
}
