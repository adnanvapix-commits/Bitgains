import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminError = requireAdmin(user!);
  if (adminError) return adminError;

  try {
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: pendingDeposits },
      { count: pendingWithdrawals },
      { count: totalTransactions },
      { count: completedTransactions },
      { data: volumeData },
      { data: walletStats },
      { data: recentPending },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }).eq('type', 'deposit').eq('status', 'pending'),
      supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }).eq('type', 'withdrawal').eq('status', 'pending'),
      supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabaseAdmin.from('transactions').select('amount').in('type', ['deposit', 'withdrawal']).eq('status', 'completed'),
      supabaseAdmin.from('wallets').select('balance, staked_amount, total_earnings, total_deposited, total_withdrawn'),
      supabaseAdmin.from('transactions').select('*, profiles!transactions_user_id_fkey(name, email)').eq('status', 'pending').in('type', ['deposit', 'withdrawal']).order('created_at', { ascending: true }).limit(10),
    ]);

    const totalVolume = (volumeData || []).reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
    const aggWallet = (walletStats || []).reduce((acc: any, w: any) => ({
      totalBalance: acc.totalBalance + parseFloat(w.balance),
      totalStaked: acc.totalStaked + parseFloat(w.staked_amount),
      totalEarnings: acc.totalEarnings + parseFloat(w.total_earnings),
      totalDeposited: acc.totalDeposited + parseFloat(w.total_deposited),
      totalWithdrawn: acc.totalWithdrawn + parseFloat(w.total_withdrawn),
      activeWallets: acc.activeWallets + (parseFloat(w.balance) > 0 ? 1 : 0),
    }), { totalBalance: 0, totalStaked: 0, totalEarnings: 0, totalDeposited: 0, totalWithdrawn: 0, activeWallets: 0 });

    return NextResponse.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers },
        transactions: { total: totalTransactions, completed: completedTransactions, pendingDeposits, pendingWithdrawals },
        volume: { total: totalVolume },
        wallets: aggWallet,
        recentPendingTransactions: (recentPending || []).map((t: any) => ({ ...t, userId: t.profiles })),
      },
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return NextResponse.json({ success: false, message: 'Error fetching dashboard statistics' }, { status: 500 });
  }
}
