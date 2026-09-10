import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function PUT(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const sb = getSupabaseAdmin();
    const uid = user!.id;
    await sb.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', uid).eq('is_broadcast', false).eq('is_read', false);
    const { data: bc } = await sb.from('notifications').select('id').eq('is_broadcast', true);
    for (const b of (bc || [])) await sb.from('notification_reads').upsert({ notification_id: b.id, user_id: uid }).catch(() => {});
    return NextResponse.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
