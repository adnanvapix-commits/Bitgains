import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../../lib/api-auth';
import { sanitizeTransactionId, logTransactionOperation, updateTransactionStatus, validateTransactionForProcessing } from '../../../../../../lib/server/helpers';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;
  try {
    const { id: rawId } = await params;
    console.log('Reject transaction - Raw ID received:', rawId, 'Type:', typeof rawId);
    
    // Validate and sanitize the ID
    const { isValid, sanitizedId, error: idError } = sanitizeTransactionId(rawId);
    if (!isValid) {
      console.log('Invalid transaction ID:', rawId, 'Error:', idError);
      return NextResponse.json({ 
        success: false, 
        message: `Invalid transaction ID: ${idError}`,
        debug: { rawId, idError }
      }, { status: 400 });
    }
    
    console.log('Using sanitized ID:', sanitizedId);
    
    const { comment } = await req.json();
    if (!comment) return NextResponse.json({ success: false, message: 'Comment is required' }, { status: 400 });
    
    const sb = getSupabaseAdmin();
    
    // First, let's check if transaction exists at all
    const { data: txExists, error: checkError } = await sb.from('transactions').select('id, status, type, user_id').eq('id', sanitizedId);
    console.log('Transaction exists check:', txExists, 'Error:', checkError);
    
    const { data: tx, error: txError } = await sb.from('transactions').select('*, profiles!transactions_user_id_fkey(id, name, email)').eq('id', sanitizedId).single();
    console.log('Full transaction query result:', tx, 'Error:', txError);
    
    if (!tx || txError) {
      console.log('Transaction not found - ID:', sanitizedId, 'Error:', txError);
      return NextResponse.json({ 
        success: false, 
        message: `Transaction not found (ID: ${sanitizedId})`, 
        debug: { id: sanitizedId, txError, txExists } 
      }, { status: 404 });
    }
    
    // Validate transaction for processing
    const validation = validateTransactionForProcessing(tx, ['deposit', 'withdrawal']);
    if (!validation.isValid) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
    }
    
    console.log('Processing transaction rejection:', {
      transactionId: sanitizedId,
      type: tx.type,
      amount: tx.amount,
      userId: tx.user_id
    });
    
    const now = new Date().toISOString();
    
    try {
      // Update transaction status to rejected using helper function
      await updateTransactionStatus(sb, sanitizedId, 'rejected', user!.id, comment);
      
      // Clean up pending transactions
      const { error: pendingDeleteError } = await sb.from('wallet_pending_transactions')
        .delete()
        .eq('transaction_id', sanitizedId);
        
      if (pendingDeleteError) {
        console.error('Failed to delete pending transaction:', pendingDeleteError);
        // Non-critical error, continue
      }
      
      // Get updated transaction data
      const { data: updatedTransaction } = await sb.from('transactions')
        .select('*')
        .eq('id', sanitizedId)
        .single();
      
      console.log('Transaction rejected successfully:', sanitizedId);
      
      // Log audit entry
      await logTransactionOperation(sb, {
        adminId: user!.id,
        adminEmail: user!.email,
        operation: 'REJECT',
        transactionId: sanitizedId,
        transactionType: tx.type,
        amount: tx.amount,
        userId: tx.user_id,
        userEmail: tx.profiles?.email,
        comment
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Transaction rejected successfully', 
        data: { 
          transaction: updatedTransaction 
        } 
      });
      
    } catch (error) {
      console.error('Transaction rejection error:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Transaction rejection failed. Please try again.' 
      }, { status: 500 });
    }
  } catch (err: any) { 
    console.error('Reject transaction error:', err);
    return NextResponse.json({ 
      success: false, 
      message: err.message || 'An unexpected error occurred' 
    }, { status: 500 }); 
  }
}
