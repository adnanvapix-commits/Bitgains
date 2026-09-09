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
    const { comment } = await req.json();
    if (!comment) return NextResponse.json({ success: false, message: 'Comment is required when rejecting' }, { status: 400 });

    const { data: tx } = await supabaseAdmin.from('transactions').select('*').eq('id', id).single();
    if (!tx) return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
    if (tx.status !== 'pending') return NextResponse.json({ success: false, message: `Transaction is already ${tx.status}` }, { status: 400 });

    await supabaseAdmin.from('transactions').update({
      status: 'rejected', reviewed_by: user!.id,
      reviewed_at: new Date().toISOString(), review_comment: comment,
    }).eq('id', id);
    await supabaseAdmin.from('wallet_pending_transactions').delete().eq('transaction_id', id).catch(() => {});

    const { data: updated } = await supabaseAdmin.from('transactions').select('*').eq('id', id).single();
    return NextResponse.json({ success: true, message: 'Transaction rejected successfully', data: { transaction: updated } });
  } catch (err) {
    console.error('Reject transaction error:', err);
    return NextResponse.json({ success: false, message: 'Error rejecting transaction' }, { status: 500 });
  }
}
