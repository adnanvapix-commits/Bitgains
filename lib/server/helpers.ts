import crypto from 'crypto';

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
