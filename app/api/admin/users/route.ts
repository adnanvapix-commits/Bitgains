import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../lib/api-auth';
import { getPaginationData } from '../../../../lib/server/helpers';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  try {
    const sb = getSupabaseAdmin();
    let q = sb.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (status) q = q.eq('is_active', status === 'active');
    if (search) q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    const { data: users, count } = await q;
    const ids = (users || []).map((u: any) => u.id);
    const { data: wallets } = ids.length ? await sb.from('wallets').select('*, stakes(*)').in('user_id', ids) : { data: [] };
    const wmap = new Map((wallets || []).map((w: any) => [w.user_id, w]));
    const result = (users || []).map((u: any) => {
      const w: any = wmap.get(u.id);
      return { ...u, wallet: w ? { balance: w.balance, stakedAmount: w.staked_amount, availableBalance: w.balance - w.staked_amount, totalEarnings: w.total_earnings, totalDeposited: w.total_deposited, totalWithdrawn: w.total_withdrawn, stakingStartDate: w.staking_start_date, stakes: (w.stakes || []).map((s: any) => ({ stakeId: s.stake_id, amount: s.amount, packageType: s.package_type, status: s.status, startDate: s.start_date, endDate: s.end_date })) } : null };
    });
    return NextResponse.json({ success: true, data: { users: result, pagination: getPaginationData(page, limit, count || 0) } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
