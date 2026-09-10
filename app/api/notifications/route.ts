import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const from = (page - 1) * limit;
  try {
    const sb = getSupabaseAdmin();
    const uid = user!.id;
    let q = sb.from('notifications').select('*').eq('user_id', uid).eq('is_broadcast', false).order('created_at', { ascending: false });
    if (unreadOnly) q = q.eq('is_read', false);
    const { data: individual } = await q;
    const { data: broadcasts } = await sb.from('notifications').select('*, notification_reads!left(user_id)').eq('is_broadcast', true).order('created_at', { ascending: false });
    const broadcastMapped = (broadcasts || []).map((n: any) => ({ ...n, isRead: (n.notification_reads || []).some((r: any) => r.user_id === uid) }));
    let all = [...(individual || []).map((n: any) => ({ ...n, isRead: n.is_read })), ...broadcastMapped].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (unreadOnly) all = all.filter(n => !n.isRead);
    const total = all.length;
    return NextResponse.json({ success: true, data: { notifications: all.slice(from, from + limit), pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
