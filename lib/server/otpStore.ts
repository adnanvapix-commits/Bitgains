import crypto from 'crypto';

// NOTE: This is in-memory. On Vercel serverless this persists per warm instance.
// For production scale, replace with Supabase table or Redis (Upstash).
const store = new Map<string, { hash: string; attempts: number; expiresAt: number; metadata: any }>();

const hashOtp = (code: string) => crypto.createHash('sha256').update(code).digest('hex');

const generateNumericOtp = (length: number) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return crypto.randomInt(min, max + 1).toString().padStart(length, '0');
};

export const createOtpSession = ({
  userId,
  context,
  metadata = {},
}: {
  userId: string;
  context: string;
  metadata?: any;
}) => {
  const length = parseInt(process.env.OTP_LENGTH || '6', 10);
  const ttlMs = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10) * 60 * 1000;
  const otp = generateNumericOtp(length);
  const expiresAt = Date.now() + ttlMs;
  store.set(`${userId}:${context}`, { hash: hashOtp(otp), attempts: 0, expiresAt, metadata });
  return { otp, expiresAt };
};

export const verifyOtpSession = ({ userId, context, code }: { userId: string; context: string; code: string }) => {
  const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10);
  const key = `${userId}:${context}`;
  const entry = store.get(key);

  if (!entry) return { success: false, errorCode: 'NOT_FOUND', message: 'No OTP request found. Please request a new OTP.', needsNewOtp: true };
  if (Date.now() > entry.expiresAt) { store.delete(key); return { success: false, errorCode: 'EXPIRED', message: 'OTP has expired. Please request a new one.', needsNewOtp: true }; }
  if (entry.attempts >= maxAttempts) { store.delete(key); return { success: false, errorCode: 'ATTEMPTS_EXCEEDED', message: 'Too many failed attempts. Please request a new OTP.', needsNewOtp: true }; }

  if (hashOtp(code) !== entry.hash) {
    entry.attempts += 1;
    const attemptsRemaining = Math.max(maxAttempts - entry.attempts, 0);
    if (attemptsRemaining === 0) store.delete(key); else store.set(key, entry);
    return { success: false, errorCode: 'INVALID_CODE', message: `Invalid OTP. ${attemptsRemaining} attempts remaining.`, attemptsRemaining, needsNewOtp: attemptsRemaining === 0 };
  }

  store.delete(key);
  return { success: true, metadata: entry.metadata };
};

export const invalidateOtpSession = ({ userId, context }: { userId: string; context: string }) => {
  store.delete(`${userId}:${context}`);
};

export const OTP_CONTEXTS = { WITHDRAWAL: 'withdrawal' };
