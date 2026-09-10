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
    const { status } = await req.json();
    const valid = ['open', 'in-progress', 'resolved', 'closed'];
    if (!valid.includes(status)) return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    const updates: any = { status };
    if (status === 'resolved') { updates.resolved_by = user!.id; updates.resolved_at = new Date().toISOString(); }
    const { data: updated } = await getSupabaseAdmin().from('issues').update(updates).eq('id', id).select().single();
    if (!updated) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Status updated', data: { issue: updated } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
