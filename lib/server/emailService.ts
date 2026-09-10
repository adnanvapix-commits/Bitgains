import { Resend } from 'resend';

let client: Resend | null = null;
const getClient = () => {
  if (!client) client = new Resend(process.env.RESEND_API_KEY!);
  return client;
};

const FROM = () => `${process.env.EMAIL_FROM_NAME || 'BitGains'} <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`;
const SITE = () => process.env.FRONTEND_URL || 'https://bitgains.co';

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
