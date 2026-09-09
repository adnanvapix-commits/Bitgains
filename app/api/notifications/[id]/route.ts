import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const { id } = await params;
    const { data: notification } = await supabaseAdmin.from('notifications').select('*').eq('id', id).single();
    if (!notification) return NextResponse.json({ success: false, message: 'Notification not found' }, { status: 404 });

    if (notification.is_broadcast) {
      await supabaseAdmin.from('notification_reads').upsert({ notification_id: id, user_id: user!.id, read_at: new Date().toISOString() }, { onConflict: 'notification_id,user_id' });
    } else {
      if (notification.user_id !== user!.id) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
      await supabaseAdmin.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id);
    }

    return NextResponse.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Error marking notification as read' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const { id } = await params;
    const { data: notification } = await supabaseAdmin.from('notifications').select('*').eq('id', id).single();
    if (!notification) return NextResponse.json({ success: false, message: 'Notification not found' }, { status: 404 });

    if (notification.is_broadcast) {
      await supabaseAdmin.from('notification_reads').upsert({ notification_id: id, user_id: user!.id, read_at: new Date().toISOString() }, { onConflict: 'notification_id,user_id' });
    } else {
      if (notification.user_id !== user!.id) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
      await supabaseAdmin.from('notifications').delete().eq('id', id);
    }

    return NextResponse.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Error deleting notification' }, { status: 500 });
  }
}
