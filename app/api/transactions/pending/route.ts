import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const { data: transactions, count } = await supabaseAdmin
      .from('transactions').select('*', { count: 'exact' })
      .eq('user_id', user!.id).eq('status', 'pending')
      .order('created_at', { ascending: false });

    return NextResponse.json({ success: true, data: { transactions: transactions || [], count: count || 0 } });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Error fetching pending transactions' }, { status: 500 });
  }
}
