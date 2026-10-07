import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const sb = getSupabaseAdmin();

    const { data: payouts, count, error: fetchErr } = await sb
      .from('transactions')
      .select('*, profiles!transactions_user_id_fkey(name, email)', { count: 'exact' })
      .eq('type', 'staking_payout')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .range(from, to);

    if (fetchErr) throw fetchErr;

    // Aggregate stats
    const { data: allPayouts } = await sb
      .from('transactions')
      .select('amount, metadata')
      .eq('type', 'staking_payout')
      .eq('status', 'completed');

    const totalDistributed = (allPayouts || []).reduce((s, t) => s + Number(t.amount), 0);

    return NextResponse.json({
      success: true,
      data: {
        payouts: (payouts || []).map(p => ({ ...p, user: (p as any).profiles })),
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
        summary: {
          totalDistributed,
          totalPayoutRecords: count || 0,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Error fetching payout history' }, { status: 500 });
  }
}
