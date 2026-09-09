import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';
import { getPaginationData } from '../../../../lib/server/helpers';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let q = supabaseAdmin.from('transactions').select('*', { count: 'exact' })
      .eq('user_id', user!.id).order('created_at', { ascending: false }).range(from, to);
    if (type) q = q.eq('type', type);
    if (status) q = q.eq('status', status);

    const { data: transactions, count, error: qError } = await q;
    if (qError) throw qError;

    return NextResponse.json({
      success: true,
      data: { transactions: transactions || [], pagination: getPaginationData(page, limit, count || 0) },
    });
  } catch (err) {
    console.error('History error:', err);
    return NextResponse.json({ success: false, message: 'Error fetching transaction history' }, { status: 500 });
  }
}
