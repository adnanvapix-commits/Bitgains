import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const sb = getSupabaseAdmin();
    const uid = user!.id;

    const [{ data: profile }, { data: wallet }] = await Promise.all([
      sb.from('profiles').select('*').eq('id', uid).single(),
      sb.from('wallets').select('*').eq('user_id', uid).single(),
    ]);

    // Fetch level-1 downline (direct referrals only — for "total business")
    const { data: l1 } = await sb
      .from('profiles')
      .select('id, name, email, created_at')
      .eq('referred_by', uid)
      .order('created_at', { ascending: false });

    const l1ids = (l1 || []).map((u: any) => u.id);

    const { data: l2 } = l1ids.length
      ? await sb.from('profiles').select('id, name, email, created_at, referred_by').in('referred_by', l1ids).order('created_at', { ascending: false })
      : { data: [] };

    const l2ids = (l2 || []).map((u: any) => u.id);

    const { data: l3 } = l2ids.length
      ? await sb.from('profiles').select('id, name, email, created_at, referred_by').in('referred_by', l2ids).order('created_at', { ascending: false })
      : { data: [] };

    // Fetch wallets for ALL downline users to get staked amounts
    const allDownlineIds = [...l1ids, ...l2ids, ...(l3 || []).map((u: any) => u.id)];
    const { data: downlineWallets } = allDownlineIds.length
      ? await sb.from('wallets').select('user_id, staked_amount, balance').in('user_id', allDownlineIds)
      : { data: [] };

    // Fetch active stakes for level-1 users
    const { data: l1Stakes } = l1ids.length
      ? await sb.from('stakes').select('user_id, amount, package_type, status, start_date, end_date, stake_id').eq('status', 'active').in('user_id', l1ids)
      : { data: [] };

    // Build wallet map: userId -> { staked_amount, balance }
    const walletMap = new Map((downlineWallets || []).map((w: any) => [w.user_id, w]));

    // Build stakes map: userId -> stakes[]
    const stakesMap = new Map<string, any[]>();
    for (const s of (l1Stakes || [])) {
      if (!stakesMap.has(s.user_id)) stakesMap.set(s.user_id, []);
      stakesMap.get(s.user_id)!.push(s);
    }

    // Fetch referral earnings transactions for this user
    const { data: earningTxs } = await sb
      .from('transactions')
      .select('type, amount, metadata, created_at')
      .eq('user_id', uid)
      .in('type', ['referral_commission', 'first_deposit_bonus'])
      .eq('status', 'completed');

    const earningsByReferredUser = new Map<string, number>();
    for (const tx of (earningTxs || [])) {
      const refUserId = tx.metadata?.referredUserId;
      if (refUserId) {
        earningsByReferredUser.set(refUserId, (earningsByReferredUser.get(refUserId) || 0) + Number(tx.amount));
      }
    }

    const attachEarnings = (users: any[], level: number) =>
      (users || []).map((u: any) => {
        const w = walletMap.get(u.id);
        const stakes = stakesMap.get(u.id) || [];
        return {
          ...u,
          level,
          commissionRate: level === 1 ? 8 : level === 2 ? 4 : 2,
          earnings: earningsByReferredUser.get(u.id) || 0,
          stakedAmount: w ? Number(w.staked_amount) : 0,
          balance: w ? Number(w.balance) : 0,
          activeStakes: stakes.map((s: any) => ({
            stakeId: s.stake_id,
            amount: Number(s.amount),
            packageType: s.package_type,
            startDate: s.start_date,
            endDate: s.end_date,
          })),
        };
      });

    const l1WithEarnings = attachEarnings(l1 || [], 1);
    const l2WithEarnings = attachEarnings(l2 || [], 2);
    const l3WithEarnings = attachEarnings(l3 || [], 3);

    // Referrer
    let referrer = null;
    if (profile?.referred_by) {
      const { data: r } = await sb
        .from('profiles')
        .select('id, name, email, referral_code')
        .eq('id', profile.referred_by)
        .single();
      referrer = r;
    }

    const totalFromLevel1 = l1WithEarnings.reduce((s: number, u: any) => s + u.earnings, 0);
    const totalFromLevel2 = l2WithEarnings.reduce((s: number, u: any) => s + u.earnings, 0);
    const totalFromLevel3 = l3WithEarnings.reduce((s: number, u: any) => s + u.earnings, 0);
    const firstDepositBonusTotal = (earningTxs || [])
      .filter((tx: any) => tx.type === 'first_deposit_bonus')
      .reduce((s: number, tx: any) => s + Number(tx.amount), 0);

    const grandTotal =
      (wallet?.referral_earnings_total || 0) ||
      (totalFromLevel1 + totalFromLevel2 + totalFromLevel3);

    // Total business = sum of staked amounts of all level-1 referred users
    const totalBusiness = l1WithEarnings.reduce((s: number, u: any) => s + u.stakedAmount, 0);

    const SITE = process.env.FRONTEND_URL || 'https://bitgains.cc';

    return NextResponse.json({
      success: true,
      data: {
        referralCode: profile?.referral_code,
        referralLink: profile?.referral_code ? `${SITE}/signup?ref=${profile.referral_code}` : null,
        referrer,
        downline: {
          total: l1WithEarnings.length + l2WithEarnings.length + l3WithEarnings.length,
          level1: { count: l1WithEarnings.length, users: l1WithEarnings },
          level2: { count: l2WithEarnings.length, users: l2WithEarnings },
          level3: { count: l3WithEarnings.length, users: l3WithEarnings },
        },
        commissionRates: { level1: 8, level2: 4, level3: 2 },
        earnings: {
          level1: wallet?.referral_earnings_level1 || totalFromLevel1,
          level2: wallet?.referral_earnings_level2 || totalFromLevel2,
          level3: wallet?.referral_earnings_level3 || totalFromLevel3,
          firstDepositBonus: wallet?.referral_earnings_first_bonus || firstDepositBonusTotal,
          total: grandTotal,
        },
        totalBusiness,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
