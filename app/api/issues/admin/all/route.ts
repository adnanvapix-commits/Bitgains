import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';
import { getPaginationData } from '../../../../../lib/server/helpers';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  try {
    const sb = getSupabaseAdmin();
    let q = sb.from('issues').select('*, profiles!issues_user_id_fkey(name, email)', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (status) q = q.eq('status', status);
    if (priority) q = q.eq('priority', priority);
    const { data, count } = await q;
    const [{ count: open }, { count: inProgress }, { count: resolved }, { count: urgent }] = await Promise.all([
      sb.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      sb.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'in-progress'),
      sb.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      sb.from('issues').select('*', { count: 'exact', head: true }).eq('priority', 'urgent').in('status', ['open', 'in-progress']),
    ]);
    return NextResponse.json({ success: true, data: { issues: (data || []).map((i: any) => ({ ...i, userId: i.profiles })), stats: { total: count || 0, open, inProgress, resolved, urgent }, pagination: getPaginationData(page, limit, count || 0) } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
