import crypto from 'crypto';
import { getSupabaseAdmin } from '../supabase-server';

export const OTP_CONTEXTS = { WITHDRAWAL: 'withdrawal', SIGNUP: 'signup' };

const hash = (code: string) => crypto.createHash('sha256').update(code).digest('hex');

// ─── Supabase-backed OTP store (survives serverless cold starts) ──────────────

export const createOtpSession = async ({
  userId,
  context,
  metadata = {},
}: {
  userId: string;
  context: string;
  metadata?: any;
}) => {
  const len = parseInt(process.env.OTP_LENGTH || '6', 10);
  const ttlMin = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
  const min = 10 ** (len - 1), max = 10 ** len - 1;
  const otp = crypto.randomInt(min, max + 1).toString().padStart(len, '0');
  const expiresAt = new Date(Date.now() + ttlMin * 60000).toISOString();

  const sb = getSupabaseAdmin();
  // Upsert so re-requesting replaces the old code
  await sb.from('otp_sessions').upsert(
    {
      key: `${userId}:${context}`,
      code_hash: hash(otp),
      attempts: 0,
      expires_at: expiresAt,
      metadata: metadata,
    },
    { onConflict: 'key' }
  );

  return { otp, expiresAt: new Date(expiresAt).getTime() };
};

export const verifyOtpSession = async ({
  userId,
  context,
  code,
}: {
  userId: string;
  context: string;
  code: string;
}) => {
  const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10);
  const key = `${userId}:${context}`;
  const sb = getSupabaseAdmin();

  const { data: entry } = await sb
    .from('otp_sessions')
    .select('*')
    .eq('key', key)
    .single();

  if (!entry) return { success: false, message: 'No OTP found. Please request a new one.', needsNewOtp: true };

  if (new Date(entry.expires_at) < new Date()) {
    await sb.from('otp_sessions').delete().eq('key', key);
    return { success: false, message: 'OTP expired. Please request a new one.', needsNewOtp: true };
  }

  if (entry.attempts >= maxAttempts) {
    await sb.from('otp_sessions').delete().eq('key', key);
    return { success: false, message: 'Too many failed attempts. Please request a new OTP.', needsNewOtp: true };
  }

  if (hash(code) !== entry.code_hash) {
    const newAttempts = entry.attempts + 1;
    const left = Math.max(maxAttempts - newAttempts, 0);
    if (left === 0) {
      await sb.from('otp_sessions').delete().eq('key', key);
    } else {
      await sb.from('otp_sessions').update({ attempts: newAttempts }).eq('key', key);
    }
    return {
      success: false,
      message: `Invalid OTP. ${left} attempt${left === 1 ? '' : 's'} left.`,
      attemptsRemaining: left,
      needsNewOtp: left === 0,
    };
  }

  // Valid — delete it so it can't be reused
  await sb.from('otp_sessions').delete().eq('key', key);
  return { success: true, metadata: entry.metadata };
};

export const invalidateOtpSession = async ({
  userId,
  context,
}: {
  userId: string;
  context: string;
}) => {
  const sb = getSupabaseAdmin();
  await sb.from('otp_sessions').delete().eq('key', `${userId}:${context}`);
};
