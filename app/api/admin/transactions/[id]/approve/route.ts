import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../../lib/api-auth';
import { generateTransactionHash, sanitizeTransactionId, logTransactionOperation, updateTransactionStatus, validateTransactionForProcessing } from '../../../../../../lib/server/helpers';
import { FIRST_DEPOSIT_BONUS_PERCENT, distributeReferralRewards } from '../../../../../../lib/server/referralRewards';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;
  try {
    const { id: rawId } = await params;
    console.log('Approve transaction - Raw ID received:', rawId, 'Type:', typeof rawId);
    
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
    
    const { comment = '' } = await req.json().catch(() => ({}));
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
    
    // Get wallet with fresh data
    const { data: wallet, error: walletError } = await sb.from('wallets').select('*').eq('user_id', tx.user_id).single();
    if (walletError || !wallet) {
      console.error('Wallet lookup error:', walletError);
      return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
    }
    
    console.log('Current wallet state:', {
      balance: wallet.balance,
      staked_amount: wallet.staked_amount,
      total_deposited: wallet.total_deposited,
      total_withdrawn: wallet.total_withdrawn
    });
    
    const now = new Date().toISOString();
    const txHash = generateTransactionHash();
    
    // Begin database transaction-like operations
    try {
      if (tx.type === 'deposit') {
        const wasFirstDeposit = wallet.total_deposited === 0;
        const newBalance = wallet.balance + tx.amount;
        const newTotalDeposited = wallet.total_deposited + tx.amount;
        
        console.log('Processing deposit:', {
          oldBalance: wallet.balance,
          depositAmount: tx.amount,
          newBalance,
          newTotalDeposited,
          wasFirstDeposit
        });
        
        // Update wallet balance atomically
        const { error: walletUpdateError } = await sb.from('wallets')
          .update({ 
            balance: newBalance, 
            total_deposited: newTotalDeposited,
            updated_at: now
          })
          .eq('user_id', tx.user_id)
          .eq('balance', wallet.balance); // Optimistic locking - only update if balance hasn't changed
          
        if (walletUpdateError) {
          console.error('Wallet update failed:', walletUpdateError);
          return NextResponse.json({ 
            success: false, 
            message: 'Failed to update wallet balance. Please try again.' 
          }, { status: 500 });
        }
        
        // Update transaction status using helper function
        await updateTransactionStatus(sb, sanitizedId, 'completed', user!.id, comment, txHash);

        // Distribute multi-level referral commissions to referrers
        await distributeReferralRewards({
          userId: tx.user_id,
          depositAmount: tx.amount,
          sourceTransactionId: sanitizedId,
        }).catch(e => console.error('Referral reward distribution error:', e));

        // Handle first deposit bonus
        const { data: userProfile } = await sb.from('profiles')
          .select('referred_by, has_received_first_deposit_bonus, name, email')
          .eq('id', tx.user_id)
          .single();
          
        if (userProfile?.referred_by && wasFirstDeposit && !userProfile.has_received_first_deposit_bonus && FIRST_DEPOSIT_BONUS_PERCENT > 0) {
          const bonus = Math.round(tx.amount * FIRST_DEPOSIT_BONUS_PERCENT * 1e8) / 1e8;
          
          if (bonus > 0) {
            console.log('Processing first deposit bonus:', {
              referrerId: userProfile.referred_by,
              bonusAmount: bonus,
              depositAmount: tx.amount
            });
            
            const { data: referrerWallet } = await sb.from('wallets')
              .select('*')
              .eq('user_id', userProfile.referred_by)
              .single();
              
            if (referrerWallet) {
              // Update referrer wallet
              await sb.from('wallets').update({ 
                balance: referrerWallet.balance + bonus, 
                total_earnings: referrerWallet.total_earnings + bonus, 
                referral_earnings_first_bonus: (referrerWallet.referral_earnings_first_bonus || 0) + bonus, 
                referral_earnings_total: (referrerWallet.referral_earnings_total || 0) + bonus,
                updated_at: now
              }).eq('user_id', userProfile.referred_by);
              
              // Mark user as having received first deposit bonus
              await sb.from('profiles')
                .update({ has_received_first_deposit_bonus: true })
                .eq('id', tx.user_id);
              
              // Create bonus transaction
              await sb.from('transactions').insert({ 
                user_id: userProfile.referred_by, 
                type: 'first_deposit_bonus', 
                amount: bonus, 
                status: 'completed', 
                description: `First deposit bonus from ${userProfile.name || userProfile.email}'s deposit`, 
                completed_at: now,
                metadata: { 
                  referredUserId: tx.user_id, 
                  sourceTransactionId: sanitizedId 
                } 
              });
            }
          }
        }
        
      } else if (tx.type === 'withdrawal') {
        const availableBalance = wallet.balance - wallet.staked_amount;
        
        console.log('Processing withdrawal:', {
          currentBalance: wallet.balance,
          stakedAmount: wallet.staked_amount,
          availableBalance,
          withdrawalAmount: tx.amount
        });
        
        if (availableBalance < tx.amount) {
          return NextResponse.json({ 
            success: false, 
            message: `Insufficient balance. Available: ${availableBalance.toFixed(2)} USDT, Requested: ${tx.amount.toFixed(2)} USDT` 
          }, { status: 400 });
        }
        
        const newBalance = wallet.balance - tx.amount;
        const newTotalWithdrawn = wallet.total_withdrawn + tx.amount;
        
        // Update wallet balance atomically
        const { error: walletUpdateError } = await sb.from('wallets')
          .update({ 
            balance: newBalance, 
            total_withdrawn: newTotalWithdrawn,
            updated_at: now
          })
          .eq('user_id', tx.user_id)
          .eq('balance', wallet.balance); // Optimistic locking
          
        if (walletUpdateError) {
          console.error('Wallet update failed:', walletUpdateError);
          return NextResponse.json({ 
            success: false, 
            message: 'Failed to update wallet balance. Please try again.' 
          }, { status: 500 });
        }
        
        // Update transaction status using helper function
        await updateTransactionStatus(sb, sanitizedId, 'completed', user!.id, comment, txHash);
      }
      
    } catch (error) {
      console.error('Transaction processing error:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Transaction processing failed. Please try again.' 
      }, { status: 500 });
    }
    
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
    
    console.log('Transaction approved successfully:', sanitizedId);
    
    // Log audit entry
    await logTransactionOperation(sb, {
      adminId: user!.id,
      adminEmail: user!.email,
      operation: 'APPROVE',
      transactionId: sanitizedId,
      transactionType: tx.type,
      amount: tx.amount,
      userId: tx.user_id,
      userEmail: tx.profiles?.email,
      comment,
      previousBalance: wallet.balance,
      newBalance: tx.type === 'deposit' ? wallet.balance + tx.amount : wallet.balance - tx.amount
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `${tx.type} approved successfully`, 
      data: { 
        transaction: updatedTransaction 
      } 
    });
  } catch (err: any) { 
    console.error('Approve transaction error:', err);
    return NextResponse.json({ 
      success: false, 
      message: err.message || 'An unexpected error occurred' 
    }, { status: 500 }); 
  }
}
