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
    const { data: issue } = await sb.from('issues').select('status').eq('id', id).single();
    if (!issue) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    const { data: updated } = await sb.from('issues').update({ admin_response: response, status: issue.status === 'open' ? 'in-progress' : issue.status }).eq('id', id).select().single();
    return NextResponse.json({ success: true, message: 'Response added', data: { issue: updated } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
