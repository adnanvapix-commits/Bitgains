import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const { id } = await params;
    const sb = getSupabaseAdmin();
    const { data: n } = await sb.from('notifications').select('*').eq('id', id).single();
    if (!n) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    if (n.is_broadcast) {
      await sb.from('notification_reads').upsert({ notification_id: id, user_id: user!.id });
    } else {
      await sb.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id).eq('user_id', user!.id);
    }
    return NextResponse.json({ success: true, message: 'Marked as read' });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const { id } = await params;
    const sb = getSupabaseAdmin();
    const { data: n } = await sb.from('notifications').select('*').eq('id', id).single();
    if (!n) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    if (n.is_broadcast) {
      await sb.from('notification_reads').upsert({ notification_id: id, user_id: user!.id });
      return NextResponse.json({ success: true, message: 'Notification hidden' });
    }
    if (n.user_id !== user!.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    await sb.from('notifications').delete().eq('id', id);
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
