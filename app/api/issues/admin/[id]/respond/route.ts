import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../../lib/api-auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminError = requireAdmin(user!);
  if (adminError) return adminError;

  try {
    const { id } = await params;
    const { response } = await req.json();
    if (!response) return NextResponse.json({ success: false, message: 'Response is required' }, { status: 400 });

    const { data: issue } = await supabaseAdmin.from('issues').select('*').eq('id', id).single();
    if (!issue) return NextResponse.json({ success: false, message: 'Issue not found' }, { status: 404 });

    const newStatus = issue.status === 'open' ? 'in-progress' : issue.status;
    await supabaseAdmin.from('issues').update({ admin_response: response, status: newStatus, resolved_by: user!.id }).eq('id', id);

    return NextResponse.json({ success: true, message: 'Response submitted successfully' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Error responding to issue' }, { status: 500 });
  }
}
