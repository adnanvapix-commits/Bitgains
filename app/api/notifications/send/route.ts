import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../lib/api-auth';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;
  try {
    const { title, message, userId, type = 'info', actionUrl } = await req.json();
    if (!title || !message) return NextResponse.json({ success: false, message: 'Title and message required' }, { status: 400 });
    const sb = getSupabaseAdmin();
    const isBroadcast = !userId || userId === 'all';
    const { data: notif } = await sb.from('notifications').insert({ title, message, type, action_url: actionUrl, user_id: isBroadcast ? null : userId, is_broadcast: isBroadcast, sent_by: user!.id }).select().single();
    return NextResponse.json({ success: true, message: isBroadcast ? 'Broadcast sent' : 'Notification sent', data: notif }, { status: 201 });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
