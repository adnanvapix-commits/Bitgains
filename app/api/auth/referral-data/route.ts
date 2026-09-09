import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const uid = user!.id;
    const [{ data: profile }, { data: wallet }] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', uid).single(),
      supabaseAdmin.from('wallets').select('*').eq('user_id', uid).single(),
    ]);

    // Level 1
    const { data: level1Users } = await supabaseAdmin
      .from('profiles').select('id, name, email, created_at, referral_code')
      .eq('referred_by', uid).order('created_at', { ascending: false });
    const l1Ids = (level1Users || []).map((u: any) => u.id);

    // Level 2
    const { data: level2Users } = l1Ids.length
      ? await supabaseAdmin.from('profiles').select('id, name, email, created_at, referred_by').in('referred_by', l1Ids).order('created_at', { ascending: false })
      : { data: [] };
    const l2Ids = (level2Users || []).map((u: any) => u.id);

    // Level 3
    const { data: level3Users } = l2Ids.length
      ? await supabaseAdmin.from('profiles').select('id, name, email, created_at, referred_by').in('referred_by', l2Ids).order('created_at', { ascending: false })
      : { data: [] };

    const l1 = level1Users || [], l2 = level2Users || [], l3 = level3Users || [];

    // Referrer info
    let referrer = null;
    if (profile?.referred_by) {
      const { data: ref } = await supabaseAdmin.from('profiles').select('id, name, email, referral_code').eq('id', profile.referred_by).single();
      referrer = ref;
    }

    const SITE = process.env.FRONTEND_URL || 'https://bitgains.co';

    return NextResponse.json({
      success: true,
      data: {
        referralCode: profile?.referral_code,
        referralLink: profile?.referral_code ? `${SITE}/signup?ref=${profile.referral_code}` : null,
        referrer,
        downline: {
          total: l1.length + l2.length + l3.length,
          level1: { count: l1.length, users: l1 },
          level2: { count: l2.length, users: l2 },
          level3: { count: l3.length, users: l3 },
        },
        totalReferrals: l1.length + l2.length + l3.length,
        commissionRates: { level1: 8, level2: 4, level3: 2 },
        earnings: {
          level1: wallet?.referral_earnings_level1 || 0,
          level2: wallet?.referral_earnings_level2 || 0,
          level3: wallet?.referral_earnings_level3 || 0,
          firstDepositBonus: wallet?.referral_earnings_first_bonus || 0,
          total: wallet?.referral_earnings_total || 0,
        },
      },
    });
  } catch (err) {
    console.error('Referral data error:', err);
    return NextResponse.json({ success: false, message: 'Error fetching referral data' }, { status: 500 });
  }
}
