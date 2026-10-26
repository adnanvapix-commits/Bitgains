import { Resend } from 'resend';

let client: Resend | null = null;
const getClient = () => {
  if (!client) client = new Resend(process.env.RESEND_API_KEY!);
  return client;
};

const FROM = () => `${process.env.EMAIL_FROM_NAME || 'BitGains'} <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`;
const SITE = () => process.env.FRONTEND_URL || 'https://bitgains.cc';

const send = async (to: string, subject: string, html: string) => {
  try {
    await getClient().emails.send({ from: FROM(), to, subject, html });
  } catch (e) { console.error('Email error:', e); }
};

export const sendPasswordResetEmail = async (email: string, token: string, name: string) =>
  send(email, 'Password Reset - BitGains', `<p>Hi ${name || 'User'},</p><p>Reset your password: <a href="${SITE()}/reset-password?token=${token}">${SITE()}/reset-password?token=${token}</a></p><p>Expires in 1 hour.</p>`);

export const sendPasswordResetSuccessEmail = async (email: string, name: string) =>
  send(email, 'Password Reset Successful - BitGains', `<p>Hi ${name || 'User'},</p><p>Your BitGains password was successfully changed.</p>`);

export const sendEmailVerificationEmail = async (email: string, token: string, name: string) =>
  send(email, 'Verify your email - BitGains', `<p>Hi ${name},</p><p>Verify your email: <a href="${SITE()}/verify-email?token=${token}">${SITE()}/verify-email?token=${token}</a></p>`);

export const sendWithdrawalOTPEmail = async (email: string, otp: string, name: string, amount: number | string, address: string) =>
  send(email, 'Withdrawal OTP - BitGains', `
    <p>Hi ${name || 'User'},</p>
    <p>Your OTP for withdrawing <b>${amount} USDT</b> to <code>${address}</code>:</p>
    <h2 style="letter-spacing:8px;color:#10b981">${otp}</h2>
    <p>Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. Never share this code.</p>
  `);

export const sendSignupOTPEmail = async (email: string, otp: string, name: string) =>
  send(email, 'Verify your email - BitGains', `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:16px">
      <div style="text-align:center;margin-bottom:24px">
        <h2 style="color:#10b981;margin:0">BitGains</h2>
        <p style="color:#6b7280;margin:4px 0 0">Email Verification</p>
      </div>
      <p style="color:#111827">Hi <strong>${name || 'User'}</strong>,</p>
      <p style="color:#374151">Use the code below to verify your email and complete your account registration:</p>
      <div style="background:#f0fdf4;border:2px solid #10b981;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <div style="font-size:40px;font-weight:700;letter-spacing:12px;color:#10b981">${otp}</div>
      </div>
      <p style="color:#6b7280;font-size:14px">This code expires in <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong>.</p>
      <p style="color:#6b7280;font-size:14px">If you did not request this, please ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
      <p style="color:#9ca3af;font-size:12px;text-align:center">BitGains - USDT Staking Platform</p>
    </div>
  `);
