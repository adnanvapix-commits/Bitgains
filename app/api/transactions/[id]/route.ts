import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const { id } = await params;
    const { data: transaction, error: txError } = await getSupabaseAdmin()
      .from('transactions').select('*').eq('id', id).eq('user_id', user!.id).single();
    if (txError || !transaction) return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: { transaction } });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Error fetching transaction' }, { status: 500 });
  }
}
