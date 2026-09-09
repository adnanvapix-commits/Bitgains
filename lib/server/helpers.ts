import crypto from 'crypto';

export const generateTransactionHash = () => '0x' + crypto.randomBytes(32).toString('hex');

export const calculateFee = (amount: number, feePercentage: number) =>
  (amount * feePercentage) / 100;

export const validateTransactionAmount = (amount: number, type: string) => {
  if (isNaN(amount) || amount <= 0) return { valid: false, message: 'Amount must be a positive number' };
  const min = type === 'withdrawal'
    ? parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT || '20')
    : parseFloat(process.env.MIN_DEPOSIT_AMOUNT || '10');
  const max = parseFloat(process.env.MAX_TRANSACTION_AMOUNT || '100000');
  if (amount < min) return { valid: false, message: `Minimum ${type} amount is ${min} USDT` };
  if (amount > max) return { valid: false, message: `Maximum ${type} amount is ${max} USDT` };
  return { valid: true };
};

export const getPaginationData = (page: number, limit: number, totalCount: number) => {
  const currentPage = page || 1;
  const perPage = limit || 20;
  const totalPages = Math.ceil(totalCount / perPage);
  return {
    currentPage,
    perPage,
    totalPages,
    totalCount,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null,
  };
};

export const generateReferenceId = (prefix = 'TXN') => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${randomStr}`;
};

export const getClientIP = (req: Request) => {
  return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
};

export const getUserAgent = (req: Request) => req.headers.get('user-agent') || 'Unknown';
