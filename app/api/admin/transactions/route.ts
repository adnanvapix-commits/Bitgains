import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../lib/api-auth';
import { getPaginationData } from '../../../../lib/server/helpers';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const userId = searchParams.get('userId');
  const search = searchParams.get('search');
  try {
    const sb = getSupabaseAdmin();
    let q = sb.from('transactions').select('*, profiles!transactions_user_id_fkey(name, email)', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (type) q = q.eq('type', type);
    if (status) q = q.eq('status', status);
    if (userId) q = q.eq('user_id', userId);
    if (search) {
      const { data: mu } = await sb.from('profiles').select('id').or(`email.ilike.%${search}%,name.ilike.%${search}%`);
      const ids = (mu || []).map((u: any) => u.id);
      if (ids.length) q = q.or(`user_id.in.(${ids.join(',')}),description.ilike.%${search}%`);
      else q = q.ilike('description', `%${search}%`);
    }
    const { data, count } = await q;
    return NextResponse.json({ success: true, data: { transactions: (data || []).map((t: any) => ({ ...t, userId: t.profiles })), pagination: getPaginationData(page, limit, count || 0) } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
