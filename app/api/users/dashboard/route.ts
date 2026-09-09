import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';
import { getCurrentStakingMonth, getMonthlyRate } from '../../../../lib/server/stakingRates';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const [{ data: wallet }, { data: recentTxs }, { count: pendingCount }] = await Promise.all([
      supabaseAdmin.from('wallets').select('*').eq('user_id', user!.id).single(),
      supabaseAdmin.from('transactions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
      supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).eq('status', 'pending'),
    ]);

    const currentMonth = wallet?.staking_start_date ? getCurrentStakingMonth(wallet.staking_start_date) : 1;
    const currentRate = getMonthlyRate(currentMonth);

    return NextResponse.json({
      success: true,
      data: {
        wallet: wallet ? {
          balance: wallet.balance,
          stakedAmount: wallet.staked_amount,
          availableBalance: wallet.balance - wallet.staked_amount,
          totalEarnings: wallet.total_earnings,
          totalDeposited: wallet.total_deposited,
          totalWithdrawn: wallet.total_withdrawn,
          apr: wallet.apr,
          currentStakingMonth: currentMonth,
          currentMonthlyRate: currentRate,
          currentMonthlyRatePercent: `${(currentRate * 100).toFixed(0)}%`,
        } : null,
        recentTransactions: recentTxs || [],
        stats: { pendingTransactions: pendingCount || 0 },
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return NextResponse.json({ success: false, message: 'Error fetching dashboard' }, { status: 500 });
  }
}
