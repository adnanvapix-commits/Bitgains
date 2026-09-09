import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../lib/api-auth';
import { getPaginationData } from '../../../../lib/server/helpers';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminError = requireAdmin(user!);
  if (adminError) return adminError;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let q = getSupabaseAdmin().from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
    if (status) q = q.eq('is_active', status === 'active');
    if (search) q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%`);

    const { data: users, count, error: qError } = await q;
    if (qError) throw qError;

    const userIds = (users || []).map((u: any) => u.id);
    const { data: wallets } = userIds.length
      ? await getSupabaseAdmin().from('wallets').select('*, stakes(*)').in('user_id', userIds)
      : { data: [] };

    const walletMap = new Map((wallets || []).map((w: any) => [w.user_id, w]));
    const usersWithWallets = (users || []).map((u: any) => {
      const w: any = walletMap.get(u.id);
      return {
        ...u,
        wallet: w ? {
          balance: w.balance,
          stakedAmount: w.staked_amount,
          availableBalance: w.balance - w.staked_amount,
          totalEarnings: w.total_earnings,
          totalDeposited: w.total_deposited,
          totalWithdrawn: w.total_withdrawn,
          stakingStartDate: w.staking_start_date,
          lastStakingUpdate: w.last_staking_update,
          stakes: (w.stakes || []).map((s: any) => ({ stakeId: s.stake_id, amount: s.amount, packageType: s.package_type, status: s.status, startDate: s.start_date, endDate: s.end_date })),
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: { users: usersWithWallets, pagination: getPaginationData(page, limit, count || 0) },
    });
  } catch (err) {
    console.error('Get admin users error:', err);
    return NextResponse.json({ success: false, message: 'Error fetching users' }, { status: 500 });
  }
}
