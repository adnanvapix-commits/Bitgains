import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;
  try {
    const { id } = await params;
    const sb = getSupabaseAdmin();
    const [{ data: profile }, { data: wallet }] = await Promise.all([
      sb.from('profiles').select('*').eq('id', id).single(),
      sb.from('wallets').select('*').eq('user_id', id).single(),
    ]);
    if (!profile) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: { user: profile, wallet } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;
  try {
    const { id } = await params;
    const sb = getSupabaseAdmin();
    const { data: target } = await sb.from('profiles').select('role').eq('id', id).single();
    if (!target) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    if (target.role === 'admin') return NextResponse.json({ success: false, message: 'Cannot delete admin' }, { status: 403 });
    const { count: txCount } = await sb.from('transactions').delete({ count: 'exact' }).eq('user_id', id);
    await sb.from('stakes').delete().eq('user_id', id);
    await sb.from('wallets').delete().eq('user_id', id);
    await sb.from('issues').delete().eq('user_id', id);
    await sb.from('profiles').update({ referred_by: null }).eq('referred_by', id);
    await sb.from('profiles').update({ referred_by_level2: null }).eq('referred_by_level2', id);
    await sb.auth.admin.deleteUser(id);
    return NextResponse.json({ success: true, data: { transactionsDeleted: txCount || 0 } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
