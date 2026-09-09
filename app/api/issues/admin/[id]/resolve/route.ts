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
    await supabaseAdmin.from('issues').update({ status: 'resolved', resolved_by: user!.id, resolved_at: new Date().toISOString() }).eq('id', id);
    return NextResponse.json({ success: true, message: 'Issue resolved successfully' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Error resolving issue' }, { status: 500 });
  }
}
