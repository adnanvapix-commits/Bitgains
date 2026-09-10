import crypto from 'crypto';

const store = new Map<string, { hash: string; attempts: number; expiresAt: number; metadata: any }>();
const hash = (code: string) => crypto.createHash('sha256').update(code).digest('hex');

export const OTP_CONTEXTS = { WITHDRAWAL: 'withdrawal' };

export const createOtpSession = ({ userId, context, metadata = {} }: { userId: string; context: string; metadata?: any }) => {
  const len = parseInt(process.env.OTP_LENGTH || '6', 10);
  const ttl = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10) * 60000;
  const min = 10 ** (len - 1), max = 10 ** len - 1;
  const otp = crypto.randomInt(min, max + 1).toString().padStart(len, '0');
  const expiresAt = Date.now() + ttl;
  store.set(`${userId}:${context}`, { hash: hash(otp), attempts: 0, expiresAt, metadata });
  return { otp, expiresAt };
};

export const verifyOtpSession = ({ userId, context, code }: { userId: string; context: string; code: string }) => {
  const max = parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10);
  const key = `${userId}:${context}`;
  const entry = store.get(key);
  if (!entry) return { success: false, message: 'No OTP found. Please request a new one.', needsNewOtp: true };
  if (Date.now() > entry.expiresAt) { store.delete(key); return { success: false, message: 'OTP expired.', needsNewOtp: true }; }
  if (entry.attempts >= max) { store.delete(key); return { success: false, message: 'Too many attempts.', needsNewOtp: true }; }
  if (hash(code) !== entry.hash) {
    entry.attempts++;
    const left = Math.max(max - entry.attempts, 0);
    if (left === 0) store.delete(key); else store.set(key, entry);
    return { success: false, message: `Invalid OTP. ${left} attempts left.`, attemptsRemaining: left, needsNewOtp: left === 0 };
  }
  store.delete(key);
  return { success: true, metadata: entry.metadata };
};

export const invalidateOtpSession = ({ userId, context }: { userId: string; context: string }) => store.delete(`${userId}:${context}`);
