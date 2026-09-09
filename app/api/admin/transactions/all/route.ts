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
  const status = searchParams.get('status');
  const userId = searchParams.get('userId');
  const search = searchParams.get('search');
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let q = supabaseAdmin.from('transactions')
      .select('*, profiles!transactions_user_id_fkey(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (type) q = q.eq('type', type);
    if (status) q = q.eq('status', status);
    if (userId) q = q.eq('user_id', userId);
    if (search) {
      const { data: matchedUsers } = await supabaseAdmin.from('profiles').select('id').or(`email.ilike.%${search}%,name.ilike.%${search}%`);
      const ids = (matchedUsers || []).map((u: any) => u.id);
      if (ids.length) {
        q = q.or(`user_id.in.(${ids.join(',')}),description.ilike.%${search}%`);
      } else {
        q = q.or(`description.ilike.%${search}%`);
      }
    }

    const { data: transactions, count, error: qError } = await q;
    if (qError) throw qError;

    return NextResponse.json({
      success: true,
      data: {
        transactions: (transactions || []).map((t: any) => ({ ...t, userId: t.profiles })),
        pagination: getPaginationData(page, limit, count || 0),
      },
    });
  } catch (err) {
    console.error('Get all transactions error:', err);
    return NextResponse.json({ success: false, message: 'Error fetching transactions' }, { status: 500 });
  }
}
