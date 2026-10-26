import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get('to');

  if (!to) {
    return NextResponse.json({
      success: false,
      message: 'Add ?to=your@email.com to test',
      config: {
        RESEND_API_KEY: process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.slice(0, 8)}...` : 'NOT SET',
        FROM_EMAIL: process.env.FROM_EMAIL || 'NOT SET',
        EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'NOT SET',
      },
    });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const from = `${process.env.EMAIL_FROM_NAME || 'BitGains'} <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`;

    const result = await resend.emails.send({
      from,
      to,
      subject: 'BitGains - Email Test',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#10b981">BitGains Email Test</h2>
          <p>This is a test email sent at <strong>${new Date().toISOString()}</strong>.</p>
          <p>If you received this, Resend is working correctly!</p>
          <p style="color:#6b7280;font-size:12px">From: ${from}</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${to}`,
      resendResponse: result,
      config: {
        from,
        RESEND_API_KEY: `${process.env.RESEND_API_KEY?.slice(0, 8)}...`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: err.message,
      error: err,
      config: {
        RESEND_API_KEY: process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.slice(0, 8)}...` : 'NOT SET',
        FROM_EMAIL: process.env.FROM_EMAIL || 'NOT SET',
      },
    });
  }
}
