import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';
import { getPaginationData } from '../../../../../lib/server/helpers';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminError = requireAdmin(user!);
  if (adminError) return adminError;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const type = searchParams.get('type');
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let q = supabaseAdmin.from('transactions')
      .select('*, profiles!transactions_user_id_fkey(name, email)', { count: 'exact' })
      .eq('status', 'pending')
      .in('type', type ? [type] : ['deposit', 'withdrawal'])
      .order('created_at', { ascending: true })
      .range(from, to);

    const { data: transactions, count, error: qError } = await q;
    if (qError) throw qError;

    return NextResponse.json({
      success: true,
      data: {
        transactions: (transactions || []).map((t: any) => ({ ...t, userId: t.profiles })),
        pagination: getPaginationData(page, limit, count || 0),
        summary: { totalPending: count || 0 },
      },
    });
  } catch (err) {
    console.error('Get pending transactions error:', err);
    return NextResponse.json({ success: false, message: 'Error fetching pending transactions' }, { status: 500 });
  }
}
