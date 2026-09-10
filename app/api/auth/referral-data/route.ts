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
    const { data: l1 } = await sb.from('profiles').select('id, name, email, created_at').eq('referred_by', uid).order('created_at', { ascending: false });
    const l1ids = (l1 || []).map((u: any) => u.id);
    const { data: l2 } = l1ids.length ? await sb.from('profiles').select('id, name, email, created_at').in('referred_by', l1ids).order('created_at', { ascending: false }) : { data: [] };
    const l2ids = (l2 || []).map((u: any) => u.id);
    const { data: l3 } = l2ids.length ? await sb.from('profiles').select('id, name, email, created_at').in('referred_by', l2ids).order('created_at', { ascending: false }) : { data: [] };
    let referrer = null;
    if (profile?.referred_by) {
      const { data: r } = await sb.from('profiles').select('id, name, email, referral_code').eq('id', profile.referred_by).single();
      referrer = r;
    }
    const SITE = process.env.FRONTEND_URL || 'https://bitgains.co';
    return NextResponse.json({
      success: true,
      data: {
        referralCode: profile?.referral_code,
        referralLink: profile?.referral_code ? `${SITE}/signup?ref=${profile.referral_code}` : null,
        referrer,
        downline: { total: (l1||[]).length + (l2||[]).length + (l3||[]).length, level1: { count: (l1||[]).length, users: l1 || [] }, level2: { count: (l2||[]).length, users: l2 || [] }, level3: { count: (l3||[]).length, users: l3 || [] } },
        commissionRates: { level1: 8, level2: 4, level3: 2 },
        earnings: { level1: wallet?.referral_earnings_level1 || 0, level2: wallet?.referral_earnings_level2 || 0, level3: wallet?.referral_earnings_level3 || 0, firstDepositBonus: wallet?.referral_earnings_first_bonus || 0, total: wallet?.referral_earnings_total || 0 },
      },
    });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
