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
    const { comment } = await req.json();
    if (!comment) return NextResponse.json({ success: false, message: 'Comment is required' }, { status: 400 });
    const sb = getSupabaseAdmin();
    const { data: tx } = await sb.from('transactions').select('*').eq('id', id).single();
    if (!tx) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    if (tx.status !== 'pending') return NextResponse.json({ success: false, message: `Already ${tx.status}` }, { status: 400 });
    await sb.from('transactions').update({ status: 'rejected', reviewed_by: user!.id, reviewed_at: new Date().toISOString(), review_comment: comment }).eq('id', id);
    await sb.from('wallet_pending_transactions').delete().eq('transaction_id', id).catch(() => {});
    const { data: updated } = await sb.from('transactions').select('*').eq('id', id).single();
    return NextResponse.json({ success: true, message: 'Transaction rejected', data: { transaction: updated } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
