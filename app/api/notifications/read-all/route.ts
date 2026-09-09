import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function PUT(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    // Mark individual notifications read
    await supabaseAdmin.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', user!.id).eq('is_read', false);

    // Upsert all broadcast IDs into reads
    const { data: broadcasts } = await supabaseAdmin.from('notifications').select('id').eq('is_broadcast', true);
    if (broadcasts?.length) {
      const upserts = broadcasts.map((b: any) => ({ notification_id: b.id, user_id: user!.id, read_at: new Date().toISOString() }));
      await supabaseAdmin.from('notification_reads').upsert(upserts, { onConflict: 'notification_id,user_id' });
    }

    return NextResponse.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Error marking notifications as read' }, { status: 500 });
  }
}
