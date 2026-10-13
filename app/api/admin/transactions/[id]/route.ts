import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';
import { sanitizeTransactionId } from '../../../../../lib/server/helpers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;

  try {
    const { id: rawId } = await params;
    console.log('Get transaction - Raw ID received:', rawId);

    // Validate and sanitize the ID
    const { isValid, sanitizedId, error: idError } = sanitizeTransactionId(rawId);
    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        message: `Invalid transaction ID: ${idError}`,
        debug: { rawId, idError }
      }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const { data: tx, error: txError } = await sb.from('transactions')
      .select('*, profiles!transactions_user_id_fkey(id, name, email)')
      .eq('id', sanitizedId)
      .single();

    if (!tx || txError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Transaction not found', 
        debug: { sanitizedId, txError }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction: {
          ...tx,
          user: tx.profiles
        }
      }
    });
  } catch (err: any) {
    console.error('Get transaction error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}