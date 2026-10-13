import * as crypto from 'crypto';

export const generateTransactionHash = () => '0x' + crypto.randomBytes(32).toString('hex');
export const calculateFee = (amount: number, pct: number) => (amount * pct) / 100;

export const validateTransactionAmount = (amount: number, type: string) => {
  if (!amount || amount <= 0) return { valid: false, message: 'Amount must be positive' };
  const min = type === 'withdrawal' ? parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT || '20') : parseFloat(process.env.MIN_DEPOSIT_AMOUNT || '10');
  const max = parseFloat(process.env.MAX_TRANSACTION_AMOUNT || '100000');
  if (amount < min) return { valid: false, message: `Minimum ${type} is ${min} USDT` };
  if (amount > max) return { valid: false, message: `Maximum ${type} is ${max} USDT` };
  return { valid: true };
};

export const getPaginationData = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  return { currentPage: page, perPage: limit, totalPages, totalCount: total, hasNextPage: page < totalPages, hasPrevPage: page > 1, nextPage: page < totalPages ? page + 1 : null, prevPage: page > 1 ? page - 1 : null };
};

export const getClientIP = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
export const getUserAgent = (req: Request) => req.headers.get('user-agent') || 'Unknown';

// UUID validation and sanitization
export const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const sanitizeTransactionId = (id: string): { isValid: boolean; sanitizedId: string; error?: string } => {
  if (!id) return { isValid: false, sanitizedId: '', error: 'ID is required' };
  
  const trimmedId = id.trim();
  
  if (!trimmedId) return { isValid: false, sanitizedId: '', error: 'ID cannot be empty' };

  // Accept standard UUIDs (v1-v5) as well as Supabase gen_random_uuid() output
  // Supabase uses v4 but gen_random_uuid() is fully RFC-4122 compliant
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const uuidAnyVersionRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidAnyVersionRegex.test(trimmedId)) {
    return { isValid: false, sanitizedId: trimmedId, error: 'Invalid UUID format' };
  }
  
  return { isValid: true, sanitizedId: trimmedId };
};

// Audit logging for transaction operations
export const logTransactionOperation = async (
  supabase: any,
  {
    adminId,
    adminEmail,
    operation,
    transactionId,
    transactionType,
    amount,
    userId,
    userEmail,
    comment,
    previousBalance,
    newBalance
  }: {
    adminId: string;
    adminEmail: string;
    operation: 'APPROVE' | 'REJECT';
    transactionId: string;
    transactionType: string;
    amount: number;
    userId: string;
    userEmail?: string;
    comment?: string;
    previousBalance?: number;
    newBalance?: number;
  }
) => {
  try {
    await supabase.from('audit_logs').insert({
      admin_id: adminId,
      admin_email: adminEmail,
      target_user_id: userId,
      target_user_email: userEmail,
      action: `TRANSACTION_${operation}`,
      amount,
      reason: comment || `Transaction ${operation.toLowerCase()}d`,
      previous_balance: previousBalance,
      new_balance: newBalance,
      metadata: {
        transactionId,
        transactionType,
        operation
      }
    });
  } catch (error) {
    console.error('Failed to log audit entry:', error);
    // Don't throw - audit logging failure shouldn't break the main operation
  }
};

// Helper to ensure transaction status transitions are properly recorded
export const updateTransactionStatus = async (
  supabase: any,
  transactionId: string,
  newStatus: 'completed' | 'rejected',
  adminId: string,
  comment?: string,
  txHash?: string
) => {
  const now = new Date().toISOString();
  const updateData: any = {
    status: newStatus,
    reviewed_by: adminId,
    reviewed_at: now,
    processing_at: now
  };

  if (comment) {
    updateData.review_comment = comment;
  }

  if (newStatus === 'completed') {
    updateData.completed_at = now;
    if (txHash) {
      updateData.tx_hash = txHash;
    }
  }

  // Only update if transaction is still pending to prevent race conditions
  const { error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', transactionId)
    .eq('status', 'pending');

  if (error) {
    throw new Error(`Failed to update transaction status: ${error.message}`);
  }

  return updateData;
};

// Helper to validate transaction state before processing
export const validateTransactionForProcessing = (
  transaction: any,
  expectedTypes: string[] = ['deposit', 'withdrawal']
) => {
  if (!transaction) {
    return { isValid: false, error: 'Transaction not found' };
  }

  if (transaction.status !== 'pending') {
    return { 
      isValid: false, 
      error: `Transaction is already ${transaction.status}. Only pending transactions can be processed.` 
    };
  }

  if (!expectedTypes.includes(transaction.type)) {
    return { 
      isValid: false, 
      error: `Invalid transaction type: ${transaction.type}. Expected: ${expectedTypes.join(', ')}` 
    };
  }

  if (!transaction.user_id) {
    return { isValid: false, error: 'Transaction missing user ID' };
  }

  if (!transaction.amount || transaction.amount <= 0) {
    return { isValid: false, error: 'Invalid transaction amount' };
  }

  return { isValid: true };
};
