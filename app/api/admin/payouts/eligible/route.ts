import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';
import { getPackageDurationMonths, PackageType } from '../../../../../lib/server/stakingRates';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;

  try {
    const sb = getSupabaseAdmin();
    const now = new Date();

    // Fetch all active stakes
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

    // Count how many 30-day payouts have already been distributed per stake
    let payoutCountMap = new Map<string, number>();
    const { data: payoutTxs } = await sb
      .from('transactions')
      .select('metadata')
      .eq('type', 'staking_payout');

    for (const tx of (payoutTxs || [])) {
      const stakePayouts = tx.metadata?.stakePayouts || [];
      for (const sp of stakePayouts) {
        if (sp.stakeId) {
          payoutCountMap.set(sp.stakeId, (payoutCountMap.get(sp.stakeId) || 0) + 1);
        }
      }
    }

    const userMap = new Map<string, any>();

    for (const stake of (stakes || [])) {
      const uid = stake.user_id;
      const startDate = new Date(stake.start_date);
      const endDate = new Date(stake.end_date);
      const pkgType = (stake.package_type as PackageType) || '12-month';
      const totalPayoutSlots = getPackageDurationMonths(pkgType);

      const daysTotal = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.max(0, Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const daysRemaining = Math.max(0, Math.round((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      const payoutsGiven = payoutCountMap.get(stake.stake_id) || 0;
      const payoutsRemaining = Math.max(0, totalPayoutSlots - payoutsGiven);

      // A payout slot is due if 30 * (payoutsGiven + 1) days have elapsed
      const nextPayoutDueAtDay = (payoutsGiven + 1) * 30;
      const isEligibleForPayout = daysElapsed >= nextPayoutDueAtDay && payoutsRemaining > 0;

      if (!userMap.has(uid)) {
        userMap.set(uid, {
          userId: uid,
          name: (stake as any).profiles?.name || 'Unknown',
          email: (stake as any).profiles?.email || '',
          walletBalance: (stake as any).wallets?.balance || 0,
          totalStakedAmount: 0,
          stakes: [],
          hasEligibleStake: false,
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
        totalPayoutSlots,
        payoutsGiven,
        payoutsRemaining,
        nextPayoutDueAtDay,
        isEligibleForPayout,
        status: now >= endDate ? 'matured' : 'active',
      });

      if (isEligibleForPayout) {
        entry.hasEligibleStake = true;
        entry.selectable = true;
      }
    }

    const users = Array.from(userMap.values()).map(u => ({
      ...u,
      eligibleStakedAmount: u.stakes
        .filter((s: any) => s.isEligibleForPayout)
        .reduce((sum: number, s: any) => sum + s.amount, 0),
    }));

    users.sort((a, b) => Number(b.selectable) - Number(a.selectable));

    return NextResponse.json({
      success: true,
      data: {
        users,
        summary: {
          total: users.length,
          eligible: users.filter(u => u.selectable).length,
          notYetEligible: users.filter(u => !u.selectable).length,
          totalEligibleStaked: users.reduce((s, u) => s + u.eligibleStakedAmount, 0),
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Error fetching eligible users' }, { status: 500 });
  }
}
