import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';
import { sendEmailVerificationEmail } from '../../../../lib/server/emailService';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: user!.email,
      options: { redirectTo: `${process.env.FRONTEND_URL || 'https://bitgains.co'}/verify-email` },
    });
    if (linkData?.properties?.hashed_token) {
      await sendEmailVerificationEmail(user!.email, linkData.properties.hashed_token, user!.name);
    }
    return NextResponse.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Error sending verification email' }, { status: 500 });
  }
}
