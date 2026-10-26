import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    const sb = getSupabaseAdmin();

    // Use * to avoid breaking if KYC columns don't exist yet
    let q = sb
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data: profiles, count, error: profilesError } = await q;

    if (profilesError) {
      console.error('Profiles fetch error:', profilesError);
      return NextResponse.json({ success: false, message: profilesError.message }, { status: 500 });
    }

    const ids = (profiles || []).map((u: any) => u.id);

    if (!ids.length) {
      return NextResponse.json({
        success: true,
        data: { users: [], total: count || 0, page, limit },
      });
    }

    // Fetch wallets + active stakes for all users
    const [{ data: wallets }, { data: stakes }, { data: txCounts }, { data: allReferrals }] = await Promise.all([
      sb.from('wallets').select('user_id, balance, staked_amount, total_earnings, total_deposited, total_withdrawn').in('user_id', ids),
      sb.from('stakes').select('user_id, stake_id, amount, package_type, status, start_date, end_date').in('user_id', ids).eq('status', 'active'),
      sb.from('transactions').select('user_id, type, amount, status').in('user_id', ids),
      sb.from('profiles').select('id, referred_by').in('referred_by', ids),
    ]);

    const referralIds = (allReferrals || []).map((r: any) => r.id);
    const { data: referralWallets } = referralIds.length
      ? await sb.from('wallets').select('user_id, staked_amount').in('user_id', referralIds)
      : { data: [] };

    // Build maps
    const walletMap = new Map((wallets || []).map((w: any) => [w.user_id, w]));

    const stakesMap = new Map<string, any[]>();
    for (const s of (stakes || [])) {
      if (!stakesMap.has(s.user_id)) stakesMap.set(s.user_id, []);
      stakesMap.get(s.user_id)!.push(s);
    }

    const txMap = new Map<string, any[]>();
    for (const tx of (txCounts || [])) {
      if (!txMap.has(tx.user_id)) txMap.set(tx.user_id, []);
      txMap.get(tx.user_id)!.push(tx);
    }

    const referredByMap = new Map<string, string[]>();
    for (const r of (allReferrals || [])) {
      if (!referredByMap.has(r.referred_by)) referredByMap.set(r.referred_by, []);
      referredByMap.get(r.referred_by)!.push(r.id);
    }

    const referralWalletMap = new Map((referralWallets || []).map((w: any) => [w.user_id, w]));

    const result = (profiles || []).map((u: any) => {
      const w = walletMap.get(u.id);
      const userStakes = stakesMap.get(u.id) || [];
      const userTxs = txMap.get(u.id) || [];
      const referredUserIds = referredByMap.get(u.id) || [];

      const totalBusiness = referredUserIds.reduce((sum: number, rid: string) => {
        const rw = referralWalletMap.get(rid);
        return sum + (rw ? Number(rw.staked_amount) : 0);
      }, 0);

      const depositsCount = userTxs.filter((tx: any) => tx.type === 'deposit' && tx.status === 'completed').length;
      const withdrawalsCount = userTxs.filter((tx: any) => tx.type === 'withdrawal' && tx.status === 'completed').length;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.is_active,
        referralCode: u.referral_code,
        referralCount: u.referral_count || referredUserIds.length,
        createdAt: u.created_at,
        lastLogin: u.last_login,
        // KYC fields — may be null if columns not yet migrated
        aadharNumber: u.aadhar_number || null,
        panNumber: u.pan_number || null,
        permanentAddress: u.permanent_address || null,
        dateOfBirth: u.date_of_birth || null,
        wallet: w ? {
          balance: Number(w.balance),
          stakedAmount: Number(w.staked_amount),
          availableBalance: Number(w.balance) - Number(w.staked_amount),
          totalEarnings: Number(w.total_earnings),
          totalDeposited: Number(w.total_deposited),
          totalWithdrawn: Number(w.total_withdrawn),
        } : null,
        activeStakes: userStakes.map((s: any) => ({
          stakeId: s.stake_id,
          amount: Number(s.amount),
          packageType: s.package_type,
          startDate: s.start_date,
          endDate: s.end_date,
        })),
        stats: {
          totalTransactions: userTxs.length,
          depositsCount,
          withdrawalsCount,
          totalBusiness,
          level1ReferralCount: referredUserIds.length,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        users: result,
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: any) {
    console.error('Admin users/all error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
