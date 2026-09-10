import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { sendPasswordResetEmail } from '../../../../lib/server/emailService';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const resp = NextResponse.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
    if (!email) return resp;
    const sb = getSupabaseAdmin();
    const { data: profile } = await sb.from('profiles').select('id, name').eq('email', email.trim().toLowerCase()).single();
    if (profile) {
      sb.auth.admin.generateLink({ type: 'recovery', email: email.trim().toLowerCase(), options: { redirectTo: `${process.env.FRONTEND_URL || 'https://bitgains.co'}/reset-password` } })
        .then(({ data }) => { if (data?.properties?.hashed_token) sendPasswordResetEmail(email, data.properties.hashed_token, profile.name).catch(() => {}); })
        .catch(() => {});
    }
    return resp;
  } catch { return NextResponse.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' }); }
}
