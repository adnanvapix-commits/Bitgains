import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `${process.env.EMAIL_FROM_NAME || 'BitGains'} <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://bitgains.co';

const send = async (to: string, subject: string, html: string) => {
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (e) {
    console.error('Email send error:', e);
  }
};

export const sendEmailVerificationEmail = async (email: string, token: string, name: string) => {
  const link = `${SITE}/verify-email?token=${token}`;
  await send(email, 'Verify your BitGains email', `<p>Hi ${name},</p><p>Please verify your email: <a href="${link}">${link}</a></p>`);
};

export const sendPasswordResetEmail = async (email: string, token: string, name: string) => {
  const link = `${SITE}/reset-password?token=${token}`;
  await send(email, 'Reset your BitGains password', `<p>Hi ${name || 'there'},</p><p>Reset your password: <a href="${link}">${link}</a></p><p>This link expires in 1 hour.</p>`);
};

export const sendPasswordResetSuccessEmail = async (email: string, name: string) => {
  await send(email, 'Password changed successfully', `<p>Hi ${name || 'there'},</p><p>Your BitGains password was successfully changed.</p>`);
};

export const sendWithdrawalOTPEmail = async (email: string, otp: string, name: string, amount: number | string, address: string) => {
  await send(email, 'Your BitGains withdrawal OTP', `<p>Hi ${name || 'there'},</p><p>Your OTP for withdrawing <b>${amount} USDT</b> to <code>${address}</code> is:</p><h2>${otp}</h2><p>This OTP expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.</p>`);
};
