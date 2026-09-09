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
  const to = from + limit - 1;

  try {
    // Individual notifications
    let q = getSupabaseAdmin().from('notifications').select('*', { count: 'exact' })
      .eq('user_id', user!.id).eq('is_broadcast', false).order('created_at', { ascending: false }).range(from, to);
    if (unreadOnly) q = q.eq('is_read', false);
    const { data: individual } = await q;

    // Broadcasts not yet read
    const { data: reads } = await getSupabaseAdmin().from('notification_reads').select('notification_id').eq('user_id', user!.id);
    const readIds = (reads || []).map((r: any) => r.notification_id);

    let bq = getSupabaseAdmin().from('notifications').select('*').eq('is_broadcast', true).order('created_at', { ascending: false }).limit(limit);
    if (readIds.length && unreadOnly) bq = bq.not('id', 'in', `(${readIds.join(',')})`);
    const { data: broadcasts } = await bq;

    const broadcastsWithRead = (broadcasts || []).map((n: any) => ({ ...n, is_read: readIds.includes(n.id) }));
    const all = [...(individual || []), ...broadcastsWithRead].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ success: true, data: { notifications: all, pagination: { currentPage: page, perPage: limit, totalCount: all.length } } });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Error fetching notifications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminError = requireAdmin(user!);
  if (adminError) return adminError;

  try {
    const { title, message, userId, type = 'info', actionUrl } = await req.json();
    if (!title || !message) return NextResponse.json({ success: false, message: 'Title and message are required' }, { status: 400 });

    const isBroadcast = !userId || userId === 'all';
    const { data: notification } = await getSupabaseAdmin().from('notifications').insert({
      user_id: isBroadcast ? null : userId,
      title,
      message,
      type,
      action_url: actionUrl || null,
      is_broadcast: isBroadcast,
      is_read: false,
      sent_by: user!.id,
    }).select().single();

    return NextResponse.json({ success: true, message: 'Notification sent', data: { notification } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Error sending notification' }, { status: 500 });
  }
}
