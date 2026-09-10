import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;
  try {
    const sb = getSupabaseAdmin();
    const [{ count: totalUsers }, { count: activeUsers }, { count: pendingDep }, { count: pendingWith }, { count: totalTx }, { count: completedTx }, { data: volumeData }, { data: walletStats }, { data: recentPending }] = await Promise.all([
      sb.from('profiles').select('*', { count: 'exact', head: true }),
      sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
      sb.from('transactions').select('*', { count: 'exact', head: true }).eq('type', 'deposit').eq('status', 'pending'),
      sb.from('transactions').select('*', { count: 'exact', head: true }).eq('type', 'withdrawal').eq('status', 'pending'),
      sb.from('transactions').select('*', { count: 'exact', head: true }),
      sb.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      sb.from('transactions').select('amount').in('type', ['deposit', 'withdrawal']).eq('status', 'completed'),
      sb.from('wallets').select('balance, staked_amount, total_earnings, total_deposited, total_withdrawn'),
      sb.from('transactions').select('*, profiles!transactions_user_id_fkey(name, email)').eq('status', 'pending').in('type', ['deposit', 'withdrawal']).order('created_at', { ascending: true }).limit(10),
    ]);
    const totalVolume = (volumeData || []).reduce((s: number, t: any) => s + parseFloat(t.amount), 0);
    const agg = (walletStats || []).reduce((a: any, w: any) => ({ totalBalance: a.totalBalance + +w.balance, totalStaked: a.totalStaked + +w.staked_amount, totalEarnings: a.totalEarnings + +w.total_earnings, totalDeposited: a.totalDeposited + +w.total_deposited, totalWithdrawn: a.totalWithdrawn + +w.total_withdrawn, activeWallets: a.activeWallets + (+w.balance > 0 ? 1 : 0) }), { totalBalance: 0, totalStaked: 0, totalEarnings: 0, totalDeposited: 0, totalWithdrawn: 0, activeWallets: 0 });
    return NextResponse.json({ success: true, data: { users: { total: totalUsers, active: activeUsers }, transactions: { total: totalTx, completed: completedTx, pendingDeposits: pendingDep, pendingWithdrawals: pendingWith }, volume: { total: totalVolume }, wallets: agg, recentPendingTransactions: (recentPending || []).map((t: any) => ({ ...t, userId: t.profiles })) } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
