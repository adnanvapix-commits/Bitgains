import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const [{ count: individualCount }, { data: reads }, { count: broadcastTotal }] = await Promise.all([
      getSupabaseAdmin().from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).eq('is_broadcast', false).eq('is_read', false),
      getSupabaseAdmin().from('notification_reads').select('notification_id').eq('user_id', user!.id),
      getSupabaseAdmin().from('notifications').select('*', { count: 'exact', head: true }).eq('is_broadcast', true),
    ]);

    const readIds = (reads || []).map((r: any) => r.notification_id);
    const unreadBroadcasts = Math.max(0, (broadcastTotal || 0) - readIds.length);
    const total = (individualCount || 0) + unreadBroadcasts;

    return NextResponse.json({ success: true, data: { count: total } });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Error fetching unread count' }, { status: 500 });
  }
}
