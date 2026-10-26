import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../../lib/api-auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;
  try {
    const { id } = await params;
    const { response } = await req.json();
    if (!response) return NextResponse.json({ success: false, message: 'Response required' }, { status: 400 });

    const sb = getSupabaseAdmin();
    const { data: issue } = await sb.from('issues').select('*').eq('id', id).single();
    if (!issue) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    const { data: updated } = await sb.from('issues').update({
      admin_response: response,
      status: issue.status === 'open' ? 'in-progress' : issue.status,
    }).eq('id', id).select().single();

    // Notify the user that admin replied -- with redirect to support
    if (issue.user_id) {
      const shortSubject = issue.subject?.length > 40
        ? issue.subject.slice(0, 40) + '...'
        : issue.subject;

      await sb.from('notifications').insert({
        user_id: issue.user_id,
        title: '💬 Reply from Support Team',
        message: `Admin replied to your ticket: "${shortSubject}". Visit Help & Support to read the response.`,
        type: 'info',
        action_url: '/support',
        is_broadcast: false,
        is_read: false,
        sent_by: user!.id,
      });
    }

    return NextResponse.json({ success: true, message: 'Response added', data: { issue: updated } });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
