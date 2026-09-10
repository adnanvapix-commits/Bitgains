import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const sb = getSupabaseAdmin();
    const uid = user!.id;
    const [{ count: indiv }, { data: broadcasts }, { data: reads }] = await Promise.all([
      sb.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('is_broadcast', false).eq('is_read', false),
      sb.from('notifications').select('id').eq('is_broadcast', true),
      sb.from('notification_reads').select('notification_id').eq('user_id', uid),
    ]);
    const readIds = new Set((reads || []).map((r: any) => r.notification_id));
    const unreadBC = (broadcasts || []).filter((b: any) => !readIds.has(b.id)).length;
    return NextResponse.json({ success: true, data: { count: (indiv || 0) + unreadBC } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
