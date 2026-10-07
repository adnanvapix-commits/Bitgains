import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;

  try {
    const sb = getSupabaseAdmin();
    const now = new Date().toISOString();

    // Fetch all active stakes with user + wallet info
    const { data: stakes, error: stakeErr } = await sb
      .from('stakes')
      .select(`
        id, stake_id, user_id, wallet_id, amount, package_type, status, start_date, end_date,
        profiles!stakes_user_id_fkey(id, name, email),
        wallets!stakes_wallet_id_fkey(id, balance, staked_amount)
      `)
      .eq('status', 'active')
      .order('end_date', { ascending: true });

    if (stakeErr) throw stakeErr;

    // Group stakes by user and compute maturity
    const userMap = new Map<string, any>();

    for (const stake of (stakes || [])) {
      const uid = stake.user_id;
      const isMatured = stake.end_date <= now;
      const daysTotal = Math.round(
        (new Date(stake.end_date).getTime() - new Date(stake.start_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysElapsed = Math.max(0, Math.round(
        (Date.now() - new Date(stake.start_date).getTime()) / (1000 * 60 * 60 * 24)
      ));
      const daysRemaining = Math.max(0, Math.round(
        (new Date(stake.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ));

      if (!userMap.has(uid)) {
        userMap.set(uid, {
          userId: uid,
          name: (stake as any).profiles?.name || 'Unknown',
          email: (stake as any).profiles?.email || '',
          walletBalance: (stake as any).wallets?.balance || 0,
          totalStakedAmount: 0,
          stakes: [],
          hasMaturedStake: false,
          selectable: false,
        });
      }

      const entry = userMap.get(uid)!;
      entry.totalStakedAmount += Number(stake.amount);
      entry.stakes.push({
        stakeId: stake.stake_id,
        amount: Number(stake.amount),
        packageType: stake.package_type,
        startDate: stake.start_date,
        endDate: stake.end_date,
        daysTotal,
        daysElapsed,
        daysRemaining,
        isMatured,
        status: isMatured ? 'matured' : 'active',
      });

      if (isMatured) {
        entry.hasMaturedStake = true;
        entry.selectable = true;
      }
    }

    const users = Array.from(userMap.values()).map(u => ({
      ...u,
      maturedStakedAmount: u.stakes
        .filter((s: any) => s.isMatured)
        .reduce((sum: number, s: any) => sum + s.amount, 0),
    }));

    // Sort: eligible (matured) first
    users.sort((a, b) => Number(b.selectable) - Number(a.selectable));

    return NextResponse.json({
      success: true,
      data: {
        users,
        summary: {
          total: users.length,
          eligible: users.filter(u => u.selectable).length,
          notYetEligible: users.filter(u => !u.selectable).length,
          totalMaturedStaked: users.reduce((s, u) => s + u.maturedStakedAmount, 0),
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Error fetching eligible users' }, { status: 500 });
  }
}
