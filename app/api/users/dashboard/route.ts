import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';
import { getCurrentStakingMonth, getMonthlyRate } from '../../../../lib/server/stakingRates';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const supabase = getSupabaseAdmin();
    let { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', user!.id).single();

    // Auto-create wallet if missing
    if (!wallet) {
      const { data: newWallet } = await supabase.from('wallets').insert({
        user_id: user!.id, balance: 0, staked_amount: 0, total_earnings: 0,
        total_deposited: 0, total_withdrawn: 0, apr: 12.5,
      }).select('*').single();
      wallet = newWallet;
    }

    const [{ data: recentTxs }, { count: pendingCount }] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).eq('status', 'pending'),
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
