import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID parameter required' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    
    // Check all transactions to see what's in the database
    const { data: allTransactions } = await sb.from('transactions').select('id, type, status, user_id, created_at').order('created_at', { ascending: false }).limit(10);
    
    // Try to find the specific transaction
    const { data: specificTx, error: specificError } = await sb.from('transactions').select('*').eq('id', id);
    
    // Try with different query approaches
    const { data: singleTx, error: singleError } = await sb.from('transactions').select('*').eq('id', id).single();
    
    // Check pending transactions
    const { data: pendingTxs } = await sb.from('transactions').select('id, type, status').eq('status', 'pending');
    
    return NextResponse.json({
      success: true,
      debug: {
        searchedId: id,
        idType: typeof id,
        specificTransaction: specificTx,
        specificError,
        singleTransaction: singleTx,
        singleError,
        recentTransactions: allTransactions,
        pendingTransactions: pendingTxs
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}